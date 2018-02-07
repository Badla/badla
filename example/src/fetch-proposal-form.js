import React from 'react';
import { FormControl, FormGroup, HelpBlock, ControlLabel, Button, Panel, Checkbox, Radio, Alert, Glyphicon } from 'react-bootstrap';
import FormInput from './form-input'
import ABI from './abi'
import Web3 from 'web3';
import Transaction from './transaction'
const web3 = new Web3(window.web3.currentProvider);

class FetchProposalForm extends React.Component {

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

    fetchProposal() {
        let valid = this.isValid()
        this.setState({'valid':valid})
        if (!valid) {
            return;
        }
        //Allocate of dweth tokens to badla contract
        var BadlaContract = web3.eth.contract(ABI.BadlaABI);
        var Badla = BadlaContract.at(ABI.BadlaAddress);
        var proposalId = this.state.proposalId;

        // let gas = web3.eth.getBlock('latest').gasLimit;
        console.log("Fetching proposal for id - "+proposalId)
        var proposal = Badla.proposals(proposalId, function(err, res) {
            if (err) {
                alert("error in fetching proposal");
                console.log(err);
                return;
            }
            if (!res[0]) {
                this.setState({proposal:{status:"not-found",msg:"Proposal "+proposalId+" not found"}})
                console.log("Proposal not found");
                return;
            }
            console.log(res);
            this.setState({proposal:{status:"found", msg:"Proposal "+proposalId+" details below - ", data:JSON.stringify(res, null, 4)}})
        }.bind(this))
        // Make a json and show
    }

    isValid() {
        var totalInputs = 1
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

    dismissAlert() {
        this.setState({'valid':true})
    }

    render() {
        return (
            <div>
                <h3>Fetch Proposal</h3>
                <br></br>
                { !this.state.valid ?
                    <Alert bsStyle="danger" onDismiss={this.handleDismiss}>
                      <p>
                        Please enter proposal ID!
                        <Button bsStyle="link" className="right-align" onClick={this.dismissAlert.bind(this)}>
                          <Glyphicon glyph="remove" />
                        </Button>
                      </p>
                    </Alert> : null }
                <div className="clear">
                    <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="proposalId" label="Proposal ID" placeholder="Enter Proposal Id" extraHelp="" />
                </div>
                <Button bsStyle="primary" onClick={this.fetchProposal.bind(this)}>Fetch</Button>
                <br></br><br></br>
                { this.state.proposal ?
                    <Alert bsStyle={this.state.proposal.status == 'found' ? "success" : "danger"} onDismiss={this.handleDismiss}>
                      <p>
                        {this.state.proposal.msg}
                      </p>
                    </Alert>
                : null }
                { this.state.proposal && this.state.proposal.data ?
                <div>
                    <pre>{this.state.proposal.data}</pre></div>
                : null }
            </div>
        )
    }
}

export default FetchProposalForm
