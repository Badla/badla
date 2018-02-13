import React from 'react';
import { Button, ButtonToolbar, Alert, Glyphicon } from 'react-bootstrap';
import FormInput from '../components/form-input'
import BadlaJS from '../eth/badla'

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
            this.setState({proposal:{status:"found", msg:`Proposal ${proposalId} details below - `, data:proposal, asString:JSON.stringify(proposal, null, 4)}})
        }).catch((err)=> {
            this.setState({proposal:{status:"not-found",msg:err}})
        });
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
                    <pre>{this.state.proposal.asString}</pre>
                    <ProposalActions currentAccount={this.badla.blockChain.currentAccount()} proposal={this.state.proposal.data} />
                </div>
                : null }
            </div>
        )
    }
}

class ProposalActions extends React.Component {
    constructor(props) {
        super(props);
        var proposal = props.proposal;
        var account = props.currentAccount;
        this.state = {
            cancel:(account === proposal["banker"] && proposal["statusFriendly"] === "NEW"),
            accept:(account !== proposal["banker"] && proposal["statusFriendly"] === "NEW"),
            settle:false,
            forceSettle:(account === proposal["banker"] && proposal["statusFriendly"] === "ACCEPTED")
        };
    }

    cancelProposal() {

    }

    acceptProposal() {

    }

    settleProposal() {

    }

    forceSettleProposal() {

    }

    render() {
        return (
            <ButtonToolbar>
                {this.state.cancel && <Button bsStyle="danger" onClick={this.cancelProposal.bind(this)}>Cancel</Button>}
                {this.state.accept && <Button bsStyle="success" onClick={this.acceptProposal.bind(this)}>Accept</Button>}
                {this.state.settle && <Button bsStyle="success" onClick={this.settleProposal.bind(this)}>Settle</Button>}
                {this.state.forceSettle && <Button bsStyle="danger" onClick={this.forceSettleProposal.bind(this)}>Force Settle</Button>}
            </ButtonToolbar>
        );
    }
}

export default FetchProposalForm
