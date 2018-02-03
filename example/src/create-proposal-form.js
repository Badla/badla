import React from 'react';
import { FormControl, FormGroup, HelpBlock, ControlLabel, Button, Panel, Checkbox, Radio, Alert, Glyphicon } from 'react-bootstrap';
import FormInput from './form-input'
import ABI from './abi'
import Web3 from 'web3';
const web3 = new Web3(window.web3.currentProvider);

var BadlaAddress = "0xcf1e41f0a237e212da34ebc86444cbae34d73e23"
var WETHAddress = "0x0807d5dfebe8733df50b236944b18cccfce06500"
var ER20TokenAddress = "0x70fa3b8c49c0cd61bdf063978d090749ab567239"

class CreateProposalForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            'validation' : {},
            'valid': true,
            'forceSettlement' : false
        };
        console.log('Has web3 accounts - '+web3.eth.accounts.length);
    }

    getBlock(cb) {
        web3.eth.getBlock('latest', function(err, res) {
            if (err) {
                alert('Could not get latest block');
                return;
            }
            cb(res.gasLimit)
        })
    }

    getGasPrice(cb) {
        web3.eth.getGasPrice(function(err, res) {
            if (err) {
                alert('Could not get gas price');
                return;
            }
            cb(res.toString(10))
        })
    }

    createProposal() {
        let valid = true; //this.isValid()
        this.setState({'valid':valid})
        if (!valid) {
            return;
        }
        //Allocate of dweth tokens to badla contract
        var ERCXTokenContract = web3.eth.contract(ABI.ERCXTokenABI);
        var BadlaContract = web3.eth.contract(ABI.BadlaABI);
        var DWETHToken = ERCXTokenContract.at(WETHAddress);
        var ERCXToken = ERCXTokenContract.at(ER20TokenAddress);
        var Badla = BadlaContract.at(BadlaAddress);
        var price = this.state.price;
        var returnPrice = this.state.returnPrice;
        var term = this.state.term;
        let quantity = web3.toWei(this.state.quantity);
        let triggerPrice = this.state.forceSettlement ? this.state.triggerPrice : returnPrice;

        let account = web3.eth.accounts[0];
        // let gas = web3.eth.getBlock('latest').gasLimit;
        console.log("Approving token from - "+web3.eth.accounts[0])
        DWETHToken.approve(BadlaAddress, quantity, {from:account}, function(err, res) {
            if (err) {
                alert("error in approving token");
                console.log(err);
                return;
            }
            console.log("Approved - "+res)
            var logEvent = Badla.LogBadlaEvent({},{fromBlock: 0, toBlock: 'latest'});
            logEvent.watch(function(error, result){
                console.log("Badla Log: "+JSON.stringify(arguments));
            });
            setTimeout(()=> {
                Badla.createProposal(WETHAddress, quantity, ER20TokenAddress, price, term, returnPrice, triggerPrice, {from:account}, function(err, res) {
                    if (err) {
                        alert("error in creating proposal");
                        console.log(err);
                        return;
                    }
                    alert("Proposal created")
                    console.log("Proposal created - "+res)
                })
            }, 3000)
        })
        // Make a json and show
    }

    isValid() {
        var totalInputs = 6 + (this.state.forceSettlement ? 2 : 0)
        if (Object.keys(this.state['validation']).length < totalInputs) {
            return false;
        }
        for (var key in this.state['validation']) {
            if (!this.state['validation'][key]) {
                return false;
            }
        }
        return true;
    }

    stateChanged(key, value, formValid) {
        var state = this.state;
        state[key] = value;
        state['validation'][key] = formValid;
        this.setState(state, function() {
            console.log(this.state);
        });
    }

    toggleForceSettlementInfo(event) {
        this.setState({forceSettlement:event.target.checked}, function() {
            if (!this.state.forceSettlement) {
                let newState = Object.assign({}, this.state)
                newState.priceUrl = null
                this.setState(newState)
            }
        })
    }

    dismissAlert() {
        this.setState({'valid':true})
    }

    render() {
        return (
            <div>
                <h3>Create Proposal</h3>
                <br></br><br></br>
                { !this.state.valid ?
                    <Alert bsStyle="danger" onDismiss={this.handleDismiss}>
                      <p>
                        Please check your inputs. All fields are mandatory!
                        <Button bsStyle="link" className="right-align" onClick={this.dismissAlert.bind(this)}>
                          <Glyphicon glyph="remove" />
                        </Button>
                      </p>
                    </Alert> : null }
                <div className="clear">
                    <div className="half left"><FormInput alignClass="rightAlign" validator="address" onChange={this.stateChanged.bind(this)} id="lendingToken" label="Lending Token" value={WETHAddress} placeholder="Enter Token Address" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                    <div className="half right"><FormInput validator="address" onChange={this.stateChanged.bind(this)} id="desiredToken" label="Desired Token" value={ER20TokenAddress} placeholder="Enter Token Name" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                </div>
                <FormGroup>
                    <Radio name="radioGroup" inline>Repo</Radio>{' '}
                    <Radio name="radioGroup" inline checked>Reverse Repo</Radio>{' '}
                </FormGroup>
                <div>
                    <div className="half left"><FormInput alignClass="rightAlign" validator="number" onChange={this.stateChanged.bind(this)} id="price" label="Price" value="2000" placeholder="Enter the price" extraHelp="For 1 lending token. Ex: 2000" /></div>
                    <div className="half right"><FormInput validator="number" onChange={this.stateChanged.bind(this)} id="returnPrice" label="Return Price" value="1800" placeholder="Enter the return price" extraHelp="For 1 lending token after contract term ends. Ex: 1800" /></div>
                </div>
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="quantity" label="Quantity" value="20" placeholder="Enter the quantity" extraHelp="Ex: 20" />
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="term" label="Term" value="20" placeholder="Enter the term in days" extraHelp="Ex: 15" />
                <Checkbox onChange={this.toggleForceSettlementInfo.bind(this)}>
                    Trigger Forced Settlement
                </Checkbox>
                { this.state.forceSettlement ? <Panel bsStyle="warning" ref="forceSettlementInfo">
                    <Panel.Heading>Forced Settlement Details</Panel.Heading>
                    <Panel.Body>
                        <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="triggerPrice" label="Trigger Price" value="2000" placeholder="Enter the trigger price" extraHelp="Ex: 2000" />
                        <FormInput onChange={this.stateChanged.bind(this)} validator="url" id="priceUrl" label="Price URL" placeholder="http://..." extraHelp="" />
                    </Panel.Body>
                </Panel> : null }
                <Button bsStyle="primary" onClick={this.createProposal.bind(this)}>Create</Button>
            </div>
        )
    }
}

export default CreateProposalForm
