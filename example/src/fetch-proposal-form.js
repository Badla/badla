import React from 'react';
import { Button, ButtonToolbar, Alert, Glyphicon } from 'react-bootstrap';
import FormInput from './form-input'
import ABI from './abi'
import BadlaJS from './badla'

class FetchProposalForm extends React.Component {

    badla : BadlaJS

    constructor(props) {
        super(props);
        this.badla = new BadlaJS();
        this.state = {
            'validation' : {},
            'valid': true
        };
    }

    fetchProposal() {
        let valid = this.isValid()
        this.setState({'valid':valid})
        if (!valid) {
            return;
        }
        var proposalId = this.state.proposalId;
        console.log(`Fetching proposal for id - ${proposalId}`)
        this.badla.fetchProposal(proposalId).then((proposal)=>{
            this.setState({proposal:{status:"found", msg:`Proposal ${proposalId} details below - `, data:JSON.stringify(proposal, null, 4)}})
        }).catch((err)=> {
            this.setState({proposal:{status:"not-found",msg:err}})
        });
        // this.Badla.proposals(proposalId, (err, res) => {
        //     if (err) {
        //         alert("error in fetching proposal");
        //         console.log(err);
        //         return;
        //     }
        //     if (!res[0]) {
        //         this.setState({proposal:{status:"not-found",msg:`Proposal ${proposalId} not found`}})
        //         console.log("Proposal not found");
        //         return;
        //     }
        //     console.log(res);
        //     this.setState({proposal:{status:"found", msg:`Proposal ${proposalId} details below - `, data:JSON.stringify(res, null, 4)}})
        // })
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
        this.setState(state, () => {
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
                    <FormInput onChange={this.stateChanged.bind(this)} id="proposalId" label="Proposal ID" placeholder="Enter Proposal Id" extraHelp="" />
                </div>
                <Button bsStyle="primary" onClick={this.fetchProposal.bind(this)}>Fetch</Button>
                <br></br><br></br>
                { this.state.proposal ?
                    <Alert bsStyle={this.state.proposal.status === 'found' ? "success" : "danger"} onDismiss={this.handleDismiss}>
                      <p>
                        {this.state.proposal.msg}
                      </p>
                    </Alert>
                : null }
                { this.state.proposal && this.state.proposal.data ?
                <div>
                    <pre>{this.state.proposal.data}</pre>
                    <ButtonToolbar>
                        <Button bsStyle="danger" onClick={this.fetchProposal.bind(this)}>Cancel</Button>
                        <Button bsStyle="success" onClick={this.fetchProposal.bind(this)}>Accept</Button>
                        <Button bsStyle="success" onClick={this.fetchProposal.bind(this)}>Settle</Button>
                        <Button bsStyle="danger" onClick={this.fetchProposal.bind(this)}>Force Settle</Button>
                    </ButtonToolbar>
                </div>
                : null }
            </div>
        )
    }
}

export default FetchProposalForm
