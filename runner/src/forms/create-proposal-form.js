import React from 'react';
import { DropdownButton, HelpBlock, MenuItem, FormGroup, ControlLabel, Button, Panel, Checkbox } from 'react-bootstrap';
import FormInput from '../components/form-input'
import Message from '../components/message'
import ProgressDialog from '../components/progress-dialog'
import ABI from '../eth/generated/abi'
import BadlaWeb from '../eth/badla-web'

class CreateProposalForm extends React.Component {

    badla : BadlaWeb

    constructor(props) {
        super(props);
        this.badlaWeb = new BadlaWeb();
        this.state = {
            'validation' : {},
            'valid': true,
            'forceSettlement' : false,
            'term' : 20,
            'volume' : "20",
            'isReverseRepo' : true,
            'nearLegPrice' : "2000",
            'farLegPrice' : "1800",
            'lendingToken' : ABI.WETHTokenAddress,
            'desiredToken' : ABI.ERCXTokenAddress,
            'lendingTokenName' : 'WETH',
            'desiredTokenName' : 'ERCX'
        };
    }

    componentDidMount() {
        this.termChange(this.state.term);
        this.triggerDirectionChange(true);
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
        this.setState({'valid':valid, "proposal":false})
        if (!valid) {
            this.setState({'errorMsg':'Please check your inputs. All fields are mandatory!'})
            return;
        }

        var lendingToken = this.state.lendingToken;
        var desiredToken = this.state.desiredToken;
        var nearLegPrice = this.state.nearLegPrice;
        var farLegPrice = this.state.farLegPrice;
        var term = this.state.term;
        let volume = this.state.volume;
        let triggerPrice = this.state.forceSettlement ? this.state.triggerPrice : 0;
        let priceUrl = this.state.forceSettlement ? this.state.priceUrl : "";
        let isReverseRepo = this.state.isReverseRepo;

        if (isReverseRepo && nearLegPrice < farLegPrice) {
            this.setState({'valid':false, "proposal":false, 'errorMsg':'Near leg price should be > Far leg price for reverse repo contract'})
            return;
        } else if (!isReverseRepo && nearLegPrice > farLegPrice) {
            this.setState({'valid':false, "proposal":false, 'errorMsg':'Near leg price should be < Far leg price for repo contract'})
            return;
        }

        this.setProposalCreatingState({progress:10, msg:"Waiting for token approval"});

        this.badlaWeb.createProposal(lendingToken, volume, desiredToken, nearLegPrice, term, farLegPrice, triggerPrice, priceUrl, isReverseRepo, (percent, msg) => {
            this.setProposalCreatingState({progress:percent, msg:msg})
        }).then((proposal) => {
            this.setProposalCreatingState({done:true, progress:100, userData:JSON.stringify(proposal, null, 4), msg:`Proposal created with id - "${proposal["id"]}"`});
            this.setState({proposal:proposal});
        }).catch((msg) => {
            this.setProposalCreatingState({done:true, progress:100, msg:msg, msgClass:"createError"})
        })
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
        this.setState(state, () => {
            console.log(this.state);
        });
    }

    toggleForceSettlementInfo(event) {
        this.setState({forceSettlement:event.target.checked}, () => {
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
        this.setState({'valid':true, "proposal":false})
    }

    termChange(value) {
        this.stateChanged("term", value, true);
    }

    triggerDirectionChange(value) {
        this.stateChanged("isReverseRepo", (value === true || value === "true"), true);
        var lendingToken = ABI.ERCXTokenAddress;
        var desiredToken = ABI.WETHTokenAddress;
        var lendingTokenName = "ERCX";
        var desiredTokenName = "WETH";
        if (value === true || value === "true") {
            lendingToken = ABI.WETHTokenAddress;
            desiredToken = ABI.ERCXTokenAddress;
            lendingTokenName = "WETH";
            desiredTokenName = "ERCX";
        }
        this.stateChanged("lendingToken", lendingToken, true);
        this.stateChanged("desiredToken", desiredToken, true);
        this.stateChanged("lendingTokenName", lendingTokenName, true);
        this.stateChanged("desiredTokenName", desiredTokenName, true);
    }

    render() {
        return (
            <div>
                <h3>Create Proposal</h3>
                <br></br>
                { !this.state.valid &&
                    <Message msg={this.state.errorMsg} error="true" closeable="true" dismissAlert={this.dismissAlert.bind(this)} />}
                { this.state.proposal &&
                    <Message msg={`Proposal created with id - ${this.state.proposal.id}`} error="false" closeable="true" dismissAlert={this.dismissAlert.bind(this)} />}
                <div className="clear">
                    <div className="half left"><FormInput alignClass="rightAlign" validator="address" onChange={this.stateChanged.bind(this)} id="lendingToken" value={this.state.lendingToken} placeholder="Enter Token Address" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                    <div className="half right"><FormInput validator="address" onChange={this.stateChanged.bind(this)} id="desiredToken" value={this.state.desiredToken} placeholder="Enter Token Name" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                </div>
                <div>
                    <div className="half left">
                        <div className="rightAlign tokenName">{this.state.lendingTokenName}</div>
                    </div>
                    <div className="half right">
                        <div className="tokenName">{this.state.desiredTokenName}</div>
                    </div>
                </div>
                <div>
                    <div className="half left"><FormInput alignClass="rightAlign" validator="number" onChange={this.stateChanged.bind(this)} id="nearLegPrice" label="Near Leg Price" value={this.state.nearLegPrice} placeholder="Enter the near leg price" extraHelp="For 1 lending token. Ex: 2000" /></div>
                    <div className="half right"><FormInput validator="number" onChange={this.stateChanged.bind(this)} id="farLegPrice" label="Far Leg Price" value={this.state.farLegPrice} placeholder="Enter the far leg price" extraHelp="For 1 lending token after contract term ends. Ex: 1800" /></div>
                </div>
                <FormGroup>
                    <ControlLabel>Agreement Type</ControlLabel>
                    <br />
                    <DropdownButton onSelect={this.triggerDirectionChange.bind(this)} title={this.state.isReverseRepo ? "Reverse Repo" : "Repo"} id="isReverseRepo">
                       <MenuItem eventKey="false">Repo</MenuItem>
                       <MenuItem eventKey="true">Reverse Repo</MenuItem>
                    </DropdownButton>
                </FormGroup>
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="volume" label="Volume" value={this.state.volume} placeholder="Enter the volume" extraHelp="Ex: 20" />
                <FormGroup>
                    <ControlLabel>Term</ControlLabel>
                    <br />
                    <DropdownButton onSelect={this.termChange.bind(this)} title={this.state.term} id="term">
                       <MenuItem eventKey="1">1</MenuItem>
                       <MenuItem eventKey="5">5</MenuItem>
                       <MenuItem eventKey="10">10</MenuItem>
                       <MenuItem eventKey="20">20</MenuItem>
                       <MenuItem eventKey="30">30</MenuItem>
                    </DropdownButton>
                    <HelpBlock>In Days</HelpBlock>
                </FormGroup>
                <Checkbox onChange={this.toggleForceSettlementInfo.bind(this)}>
                    Trigger Forced Settlement
                </Checkbox>
                { this.state.forceSettlement && <Panel bsStyle="warning" ref="forceSettlementInfo">
                    <Panel.Heading>Forced Settlement Details</Panel.Heading>
                    <Panel.Body>
                        <div>
                            <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="triggerPrice" label="Trigger Price" value={this.state.triggerPrice} placeholder="Enter the trigger price" extraHelp="Ex: 2000" />
                        </div>
                        <FormInput onChange={this.stateChanged.bind(this)} id="priceUrl" label="Price URL" value={this.state.priceUrl} placeholder="http://..." extraHelp="" />
                    </Panel.Body>
                </Panel> }
                <Button bsStyle="primary" onClick={this.createProposal.bind(this)}>Create</Button>
                {this.state.creatingProposal &&
                    <ProgressDialog
                        title="Creating Proposal..."
                        msg={this.state.creatingProposal.msg}
                        msgClass={this.state.creatingProposal.msgClass}
                        done={this.state.creatingProposal.done}
                        userData={this.state.creatingProposal.userData}
                        progress={this.state.creatingProposal.progress}
                        onClose={this.creatingProposalComplete.bind(this)} />
                }
                { this.state.events && <pre>this.state.events</pre> }
            </div>
        )
    }
}

export default CreateProposalForm
