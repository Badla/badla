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
        if (!valid) {
            this.setState({"alert":true,"err":true,"msg":"Please enter proposal ID!"})
            return;
        }
        this.setState({"alert":false})
        var proposalId = this.state.proposalId;
        console.log(`Fetching proposal for id - ${proposalId}`)
        this.badla.fetchProposal(proposalId).then((proposal)=>{
            this.setState({proposal:{status:"ok", msg:`Proposal ${proposalId} details below - `, data:proposal, asString:JSON.stringify(proposal, null, 4)}})
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

    onChange(status, msg) {
        var proposal = this.state.proposal;
        var ok = status !== -1;
        if (ok) {
            proposal.status = "ok";
            proposal.data.status = status;
            proposal.data.statusFriendly = this.badla.Status[status];
            proposal.asString = JSON.stringify(proposal.data, null, 4);
        }
        proposal.status = ok ? "ok" : "not-ok";
        proposal.msg = msg;
        this.setState({proposal:proposal});
    }

    render() {
        return (
            <div>
                <h3>Fetch Proposal</h3>
                <br></br>
                { this.state.alert ?
                    <Alert bsStyle={this.state.err ? "danger" : "success"} onDismiss={this.handleDismiss}>
                      <p>
                        {this.state.msg}
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
                    <Alert bsStyle={this.state.proposal.status === 'ok' ? "success" : "danger"} onDismiss={this.handleDismiss}>
                      <p>
                        {this.state.proposal.msg}
                      </p>
                    </Alert>
                : null }
                { this.state.proposal && this.state.proposal.data ?
                <div>
                    <pre>{this.state.proposal.asString}</pre>
                    <ProposalActions currentAccount={this.badla.blockChain.currentAccount()} proposal={this.state.proposal.data} onChange={this.onChange.bind(this)} />
                </div>
                : null }
            </div>
        )
    }
}

class ProposalActions extends React.Component {

    badla : BadlaJS

    constructor(props) {
        super(props);
        this.badla = new BadlaJS();
    }

    getProposalState(props) {
        var proposal = props.proposal;
        var account = props.currentAccount;
        return {
            cancel:(account === proposal["banker"] && proposal["statusFriendly"] === "NEW"),
            accept:(account !== proposal["banker"] && proposal["statusFriendly"] === "NEW"),
            settle:false,
            forceSettle:(account === proposal["banker"] && proposal["statusFriendly"] === "ACCEPTED")
        };
    }

    cancelProposal() {
        this.badla.cancelProposal(this.props.proposal.id).then(() => {
            this.props.onChange(2, "Cancelled");
        }).catch((err)=> {
            this.props.onChange(-1, "Error Occured - " + err);
        })
    }

    acceptProposal() {

    }

    settleProposal() {

    }

    forceSettleProposal() {

    }

    render() {
        var state = this.getProposalState(this.props);
        return (
            <ButtonToolbar>
                {state.cancel && <Button bsStyle="danger" onClick={this.cancelProposal.bind(this)}>Cancel</Button>}
                {state.accept && <Button bsStyle="success" onClick={this.acceptProposal.bind(this)}>Accept</Button>}
                {state.settle && <Button bsStyle="success" onClick={this.settleProposal.bind(this)}>Settle</Button>}
                {state.forceSettle && <Button bsStyle="danger" onClick={this.forceSettleProposal.bind(this)}>Force Settle</Button>}
            </ButtonToolbar>
        );
    }
}

export default FetchProposalForm
