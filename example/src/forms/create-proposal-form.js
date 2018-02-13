import React from 'react';
import { DropdownButton, HelpBlock, MenuItem, ProgressBar, Modal, FormGroup, ControlLabel, Button, Panel, Checkbox, Radio } from 'react-bootstrap';
import FormInput from '../components/form-input'
import Message from '../components/message'
import ABI from '../eth/abi'
import BadlaJS from '../eth/badla'

class CreateProposalForm extends React.Component {

    badla : BadlaJS

    constructor(props) {
        super(props);
        this.badla = new BadlaJS((event)=> {
            var events = this.state.events;
            events.push(JSON.stringify(event));
            this.setState({"events":events});
        });
        this.state = {
            'validation' : {},
            'valid': true,
            'forceSettlement' : false,
            'term' : 20
        };
    }

    componentDidMount() {
        this.termChange(20);
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

        var nearLegPrice = this.state.nearLegPrice;
        var farLegPrice = this.state.farLegPrice;
        var term = this.state.term;
        let volume = this.state.volume;
        let triggerPrice = this.state.forceSettlement ? this.state.triggerPrice : 0;
        let priceUrl = this.state.forceSettlement ? this.state.priceUrl : "";

        this.badla.createProposal(volume, nearLegPrice, term, farLegPrice, triggerPrice, priceUrl, false, (percent, msg) => {
            this.setProposalCreatingState({progress:percent, msg:msg})
        }).then((proposal) => {
            this.setProposalCreatingState({done:true, progress:100, userData:JSON.stringify(proposal, null, 4), msg:`Proposal created with id - "${proposal["id"]}"`});
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
        this.setState({'valid':true})
    }

    termChange(value) {
        this.stateChanged("term", value, true);
    }

    render() {
        return (
            <div>
                <h3>Create Proposal</h3>
                <br></br>
                { !this.state.valid &&
                    <Message msg="Please check your inputs. All fields are mandatory!" error="true" closeable="true" dismissAlert={this.dismissAlert.bind(this)} />}
                <div className="clear hidden">
                    <div className="half left"><FormInput alignClass="rightAlign" validator="address" onChange={this.stateChanged.bind(this)} id="lendingToken" value={ABI.WETHTokenAddress} placeholder="Enter Token Address" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                    <div className="half right"><FormInput validator="address" onChange={this.stateChanged.bind(this)} id="desiredToken" value={ABI.ERCXTokenAddress} placeholder="Enter Token Name" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                </div>
                <div>
                    <div className="half left">
                        <ControlLabel className="rightAlign">Cash Token</ControlLabel>
                        <div className="rightAlign tokenName">
                            WETH
                        </div>
                    </div>
                    <div className="half right">
                        <ControlLabel>
                            Token
                        </ControlLabel>
                        <div className="tokenName">ERCX</div>
                    </div>
                </div>
                <div>
                    <div className="half left"><FormInput alignClass="rightAlign" validator="number" onChange={this.stateChanged.bind(this)} id="nearLegPrice" label="Near Leg Price" value="2000" placeholder="Enter the near leg price" extraHelp="For 1 lending token. Ex: 2000" /></div>
                    <div className="half right"><FormInput validator="number" onChange={this.stateChanged.bind(this)} id="farLegPrice" label="Far Leg Price" value="1800" placeholder="Enter the far leg price" extraHelp="For 1 lending token after contract term ends. Ex: 1800" /></div>
                </div>
                <FormGroup>
                    <Radio className="marginRightRadio" name="radioGroup" inline>Repo</Radio>{' '}
                    <Radio name="radioGroup" inline defaultChecked>Reverse Repo</Radio>{' '}
                </FormGroup>
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="volume" label="Volume" value="20" placeholder="Enter the volume" extraHelp="Ex: 20" />
                <FormGroup>
                    <ControlLabel>Term</ControlLabel>
                    <br />
                    <DropdownButton bsStyle="default" onSelect={this.termChange.bind(this)} title={this.state.term} id="term">
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
                        <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="triggerPrice" label="Trigger Price" value="2000" placeholder="Enter the trigger price" extraHelp="Ex: 2000" />
                        <FormInput onChange={this.stateChanged.bind(this)} validator="url" id="priceUrl" label="Price URL" placeholder="http://..." extraHelp="" />
                    </Panel.Body>
                </Panel> }
                <Button bsStyle="primary" onClick={this.createProposal.bind(this)}>Create</Button>
                {this.state.creatingProposal &&
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
                                    <div><ProgressBar bsStyle="success" now={this.state.creatingProposal.progress} />
                                    <pre>{this.state.creatingProposal.userData}</pre></div>
                                :
                                <ProgressBar striped bsStyle="info" now={this.state.creatingProposal.progress} />
                            }
                        </Modal.Body>
                        { this.state.creatingProposal.done &&
                        <Modal.Footer>
                            <Button bsStyle="primary" onClick={this.creatingProposalComplete.bind(this)}>Close</Button>
                        </Modal.Footer>}
                    </Modal.Dialog>
                }
                { this.state.events && <pre>this.state.events</pre> }
            </div>
        )
    }
}

export default CreateProposalForm
