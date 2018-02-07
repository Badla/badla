import React from 'react';
import { ProgressBar, Modal, FormControl, FormGroup, HelpBlock, ControlLabel, Button, Panel, Checkbox, Radio, Alert, Glyphicon } from 'react-bootstrap';
import FormInput from './form-input'
import ABI from './abi'
import Web3 from 'web3';
import Transaction from './transaction'
const web3 = new Web3(window.web3.currentProvider);

class CreateProposalForm extends React.Component {

    transaction : Transaction

    constructor(props) {
        super(props);
        this.state = {
            'validation' : {},
            'valid': true,
            'forceSettlement' : false
        };
        this.transaction = new Transaction(window.web3.currentProvider);
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

    setProposalCreatingState(props) {
        props["msgClass"] = props["msgClass"] || "createSuccess";
        var creatingProposal = this.state.creatingProposal || {};
        for (var key in props) {
            creatingProposal[key] = props[key];
        }
        this.setState({"creatingProposal":creatingProposal});
    }

    createProposal() {
        let valid = this.isValid()
        this.setState({'valid':valid})
        if (!valid) {
            return;
        }

        this.setProposalCreatingState({progress:10, msg:"Waiting for token approval"});
        //Allocate of dweth tokens to badla contract
        var BadlaContract = web3.eth.contract(ABI.BadlaABI);
        var ERCXTokenContract = web3.eth.contract(ABI.ERCXTokenABI);
        var Badla = BadlaContract.at(ABI.BadlaAddress);
        var WETHToken = ERCXTokenContract.at(ABI.WETHTokenAddress);

        var price = this.state.price;
        var returnPrice = this.state.returnPrice;
        var term = this.state.term;
        let quantity = this.state.quantity;
        let triggerPrice = this.state.forceSettlement ? this.state.triggerPrice : returnPrice;
        let tokenId = Math.floor(Math.random() * 1000)
        let account = web3.eth.accounts[0];
        // let gas = web3.eth.getBlock('latest').gasLimit;
        console.log("Approving token from - "+web3.eth.accounts[0])
        WETHToken.approve(ABI.BadlaAddress, quantity, {from:account}, function(err, res) {
            if (err) {
                this.setProposalCreatingState({done:true, progress:100, msg:"Could not get tokens", msgClass:"createError"});
                console.log(err);
                return;
            }
            console.log("Approval Submitted - "+res);
            this.setProposalCreatingState({progress:30, msg:"Received token approval. Transferring..."});
            this.transaction.waitUntilMined(res).then(function() {
                console.log("Approved")
                this.setProposalCreatingState({progress:70, msg:"Received tokens. Creating proposal..."});
                var logEvent = Badla.LogBadlaEvent({},{fromBlock: 0, toBlock: 'latest'});
                logEvent.watch(function(error, result){
                    console.log("Badla Log: "+JSON.stringify(arguments));
                });
                console.log("Creating Proposal - "+tokenId)
                Badla.createProposal(tokenId, ABI.WETHTokenAddress, quantity, ABI.ERCXTokenAddress, price, term, returnPrice, triggerPrice, {from:account}, function(err, res) {
                    if (err) {
                        this.setProposalCreatingState({done:true, progress:100, msg:"Could not create proposal", msgClass:"createError"});
                        console.log(err);
                        return;
                    }
                    console.log("Proposal Creation Submitted - "+res);
                    this.setProposalCreatingState({progress:90, msg:"Creating proposal. Verifying..."});
                    this.transaction.waitUntilMined(res).then(function() {
                        Badla.tokenToProposalIds(tokenId, function(err, res) {
                            if (err) {
                                this.setProposalCreatingState({done:true, progress:100, msg:"Proposal is created but could not fetch id. Token Id - \""+tokenId+"\"", msgClass:"createError"});
                                console.log(err);
                                return;
                            }
                            this.setProposalCreatingState({done:true, progress:100, msg:"Proposal created with id - \""+res+"\""});
                            console.log("Proposal created - "+res);
                        }.bind(this));
                    }.bind(this))
                }.bind(this))
            }.bind(this));
        }.bind(this))
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

    creatingProposalComplete() {
        let newState = Object.assign({}, this.state)
        newState.creatingProposal = null
        this.setState(newState)
    }

    dismissAlert() {
        this.setState({'valid':true})
    }

    render() {
        return (
            <div>
                <h3>Create Proposal</h3>
                <br></br>
                { !this.state.valid ?
                    <Alert bsStyle="danger" onDismiss={this.handleDismiss}>
                      <p>
                        Please check your inputs. All fields are mandatory!
                        <Button bsStyle="link" className="right-align" onClick={this.dismissAlert.bind(this)}>
                          <Glyphicon glyph="remove" />
                        </Button>
                      </p>
                    </Alert> : null }
                <div className="clear hidden">
                    <div className="half left"><FormInput alignClass="rightAlign" validator="address" onChange={this.stateChanged.bind(this)} id="lendingToken" label="Lending Token" value={ABI.WETHTokenAddress} placeholder="Enter Token Address" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                    <div className="half right"><FormInput validator="address" onChange={this.stateChanged.bind(this)} id="desiredToken" label="Desired Token" value={ABI.ERCXTokenAddress} placeholder="Enter Token Name" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                </div>
                <div>
                    <div className="half left">
                        <ControlLabel className="rightAlign">Lending Token</ControlLabel>
                        <div className="rightAlign tokenName">
                            WETH
                        </div>
                    </div>
                    <div className="half right">
                        <ControlLabel>
                            Desired Token
                        </ControlLabel>
                        <div className="tokenName">ERCX</div>
                    </div>
                </div>
                <div>
                    <div className="half left"><FormInput alignClass="rightAlign" validator="number" onChange={this.stateChanged.bind(this)} id="price" label="Price" value="2000" placeholder="Enter the price" extraHelp="For 1 lending token. Ex: 2000" /></div>
                    <div className="half right"><FormInput validator="number" onChange={this.stateChanged.bind(this)} id="returnPrice" label="Return Price" value="1800" placeholder="Enter the return price" extraHelp="For 1 lending token after contract term ends. Ex: 1800" /></div>
                </div>
                <FormGroup>
                    <Radio className="marginRightRadio" name="radioGroup" inline>Repo</Radio>{' '}
                    <Radio name="radioGroup" inline defaultChecked>Reverse Repo</Radio>{' '}
                </FormGroup>
                {this.state.creatingProposal ?
                    <Modal.Dialog>
                        <Modal.Header>
                            <Modal.Title>Creating Proposal...</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className={this.state.creatingProposal.msgClass}>{this.state.creatingProposal.msg}</div>
                            <br></br>
                            {this.state.creatingProposal.done ?
                                this.state.creatingProposal.msgClass === "createError" ?
                                    <ProgressBar bsStyle="danger" now={this.state.creatingProposal.progress} />
                                    :
                                    <ProgressBar bsStyle="success" now={this.state.creatingProposal.progress} />
                                :
                                <ProgressBar striped bsStyle="info" now={this.state.creatingProposal.progress} />
                            }
                        </Modal.Body>
                        { this.state.creatingProposal.done ?
                        <Modal.Footer>
                            <Button bsStyle="primary" onClick={this.creatingProposalComplete.bind(this)}>Close</Button>
                        </Modal.Footer> : "" }
                    </Modal.Dialog>
                    : null }
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
