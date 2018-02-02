import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { FormControl, FormGroup, HelpBlock, ControlLabel, Button, Panel, Checkbox, Radio } from 'react-bootstrap';
import Web3 from 'web3';
const web3 = new Web3(window.web3.currentProvider);

class FormInput extends React.Component {

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.state = {
              value: '',
              valid: false
        };
        this.validators = {
            "address" : this.validateEthAddress.bind(this),
            "number" : this.validateNumber.bind(this),
            "nothingValidator" : function() { return null; }
        }
    }

    onChange(event) {
        this.setState({value:event.target.value}, () => {
            this.props.onChange(this.props.id, this.state.value, this.getValidationState() == null && this.state.value.length > 0)
        });
    }

    getValidationState() {
        var validator = this.props.validator || "nothingValidator";
        return this.validators[validator]();
    }

    validateNumber() {
        return this.state.value.length === 0 || /^\d+$/.test(this.state.value) ? null : "error";
    }

    validateEthAddress() {
        if (this.state.value.length >= 2 && !this.state.value.startsWith("0x")) return 'error';
        else if (this.state.value.length > 0 && this.state.value.length < 32) return 'warning';
        return null;
    }

    render() {
        return (
            <FormGroup validationState={this.getValidationState()}>
                <ControlLabel className={this.props.alignClass}>{this.props.label}</ControlLabel>
                <FormControl className={this.props.alignClass} type="text" placeholder={this.props.placeholder} id={this.props.id} onChange={this.onChange} />
                <HelpBlock className={this.props.alignClass}>{this.props.extraHelp}</HelpBlock>
            </FormGroup>
        )
    }
}

class CreateProposalForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            'validation' : {},
            'showForceSettlementInfo' : false
        };
        this.createProposal = this.createProposal.bind(this);
        console.log('Has web3 accounts - '+web3.eth.accounts.length);
    }

    createProposal() {
        if (!this.isValid()) {
            alert('Sorry please check the inputs!');
        }

    }

    isValid() {
        if (Object.keys(this.state['validation']).length < 6) {
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
        this.setState({showForceSettlementInfo:event.target.checked})
    }

    render() {
        return (
            <div>
                <h3>Create Proposal</h3>
                <br></br><br></br>
                <div>
                    <div className="half left"><FormInput alignClass="rightAlign" validator="address" onChange={this.stateChanged.bind(this)} id="lendingToken" label="Lending Token" placeholder="Enter Token Address" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                    <div className="half right"><FormInput validator="address" onChange={this.stateChanged.bind(this)} id="desiredToken" label="Desired Token" placeholder="Enter Token Name" extraHelp="A ERC20 Token Address like 0xAbd123..." /></div>
                </div>
                <div>
                    <div className="half left"><FormInput alignClass="rightAlign" validator="number" onChange={this.stateChanged.bind(this)} id="price" label="Price" placeholder="Enter the price" extraHelp="For 1 lending token. Ex: 2000" /></div>
                    <div className="half right"><FormInput validator="number" onChange={this.stateChanged.bind(this)} id="returnPrice" label="Return Price" placeholder="Enter the return price" extraHelp="For 1 lending token after contract term ends. Ex: 1800" /></div>
                </div>
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="lendingQuantity" label="Lending Quantity" placeholder="Enter the quantity" extraHelp="Ex: 20" />
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="term" label="Term" placeholder="Enter the term in days" extraHelp="Ex: 15" />
                <Checkbox onChange={this.toggleForceSettlementInfo.bind(this)}>
                    Trigger Forced Settlement
                </Checkbox>
                { this.state.showForceSettlementInfo ? <Panel bsStyle="warning" ref="forceSettlementInfo">
                    <Panel.Heading>Forced Settlement Details</Panel.Heading>
                    <Panel.Body>
                        <FormGroup>
                            <Radio name="radioGroup" inline checked>Above</Radio>{' '}
                            <Radio name="radioGroup" inline>Below</Radio>{' '}
                        </FormGroup>
                        <FormInput onChange={this.stateChanged.bind(this)} id="priceUrl" label="Price URL" placeholder="http://..." extraHelp="" />
                    </Panel.Body>
                </Panel> : null }
                <Button bsStyle="primary" onClick={this.createProposal}>Create</Button>
            </div>
        )
    }
}

ReactDOM.render(
    <CreateProposalForm />,
    document.getElementById('content')
)
