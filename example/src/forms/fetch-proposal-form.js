import React from 'react';
import { Button, ButtonToolbar } from 'react-bootstrap';
import FormInput from '../components/form-input'
import Message from '../components/message'
import BadlaJS from '../eth/badla'
import ProgressDialog from '../components/progress-dialog'

class FetchProposalForm extends React.Component {

    badla : BadlaJS

    constructor(props) {
        super(props);
        this.state = {
            'validation' : {},
            'valid': true
        };
        this.badla = new BadlaJS((event)=> {
            var events = this.state.events;
            events.push(JSON.stringify(event));
            this.setState({"events":events});
        });
    }

    fetchProposal() {
        let valid = this.isValid()
        if (!valid) {
            this.setState({"valid":false})
            return;
        }
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
                { !this.state.valid &&
                    <Message msg="Please enter proposal ID!" error="true" closeable="true" dismissAlert={this.dismissAlert.bind(this)} /> }
                <div className="clear">
                    <FormInput onChange={this.stateChanged.bind(this)} id="proposalId" label="Proposal ID" placeholder="Enter Proposal Id" extraHelp="" />
                </div>
                <Button bsStyle="primary" onClick={this.fetchProposal.bind(this)}>Fetch</Button>
                <br></br><br></br>
                { this.state.proposal &&
                    <Message msg={this.state.proposal.msg} error={this.state.proposal.status === "ok" ? "false" : "true"} closeable="false" dismissAlert={this.dismissAlert.bind(this)} />}
                { this.state.proposal && this.state.proposal.data &&
                <div>
                    <pre>{this.state.proposal.asString}</pre>
                    <ProposalActions currentAccount={this.badla.blockChain.currentAccount()} proposal={this.state.proposal.data} onChange={this.onChange.bind(this)} />
                </div> }
                { this.state.events && <pre>this.state.events</pre> }
            </div>
        )
    }
}

class ProposalActions extends React.Component {

    badla : BadlaJS

    constructor(props) {
        super(props);
        this.badla = new BadlaJS();
        this.state = {
            performingAction:false
        }
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
        this.action("cancelProposal", 2, "Cancel Proposal", "Proposal Cancelled")
    }

    setPerformingActionState(props) {
        props["title"] = props["title"] || "Accept Proposal"
        props["msgClass"] = props["msgClass"] || "createSuccess";
        var performingAction = this.state.performingAction || {};
        for (var key in props) {
            performingAction[key] = props[key];
        }
        this.setState({"performingAction":performingAction});
    }

    performingActionComplete() {
        let newState = Object.assign({}, this.state)
        newState.performingAction = null
        this.setState(newState)
    }

    action(funcKey, statusCode, title, successMessage) {
        this.badla[funcKey](this.props.proposal, (progress, msg)=>{
            this.setPerformingActionState({title:title, progress:progress, msg:msg});
        }).then(() => {
            this.setPerformingActionState({title:title, done:true, progress:100, msg:successMessage});
            this.props.onChange(statusCode, successMessage);
        }).catch((err)=> {
            this.setPerformingActionState({title:title, done:true, progress:100, msg:err, msgClass:"createError"})
            this.props.onChange(-1, "Error Occured - " + err);
        })
    }

    acceptProposal() {
        this.action("acceptProposal", 1, "Accept Proposal", "Proposal Accepted")
    }

    settleProposal() {
        this.action("settleProposal", 6, "Settle Proposal", "Proposal Settled")
    }

    forceSettleProposalOnPrice() {
        this.action("forceCloseOnPrice", 5, "Force Settle Proposal (On Price)", "Proposal Force Settled (On Price)")
    }

    forceSettleProposalOnExpiry() {
        this.action("forceCloseOnExpiry", 4, "Force Settle Proposal (On Expiry)", "Proposal Force Settled (On Expiry)")
    }

    render() {
        var state = this.getProposalState(this.props);
        return (
            <div>
                {this.state.performingAction &&
                    <ProgressDialog
                        title={this.state.performingAction.title}
                        msg={this.state.performingAction.msg}
                        msgClass={this.state.performingAction.msgClass}
                        done={this.state.performingAction.done}
                        userData={this.state.performingAction.userData}
                        progress={this.state.performingAction.progress}
                        onClose={this.performingActionComplete.bind(this)} />
                }
                <ButtonToolbar>
                    {state.cancel && <Button bsStyle="danger" onClick={this.cancelProposal.bind(this)}>Cancel</Button>}
                    {state.accept && <Button bsStyle="success" onClick={this.acceptProposal.bind(this)}>Accept</Button>}
                    {state.settle && <Button bsStyle="success" onClick={this.settleProposal.bind(this)}>Settle</Button>}
                    {state.forceSettle && <Button bsStyle="danger" onClick={this.forceSettleProposalOnPrice.bind(this)}>Force Settle (Price)</Button>}
                    {state.forceSettle && <Button bsStyle="danger" onClick={this.forceSettleProposalOnExpiry.bind(this)}>Force Settle (Expiry)</Button>}
                </ButtonToolbar>
            </div>
        );
    }
}

export default FetchProposalForm
