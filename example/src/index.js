import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { FormControl, FormGroup, HelpBlock, ControlLabel, Button } from 'react-bootstrap';

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
        this.setState({value:event.target.value});
        this.props.onChange(this.props.id, event.target.value, this.getValidationState() == null)
    }

    getValidationState() {
        var validator = this.props.validator || "nothingValidator";
        return this.validators[validator]();
    }

    validateNumber() {
        return this.state.value.length == 0 || /^\d+$/.test(this.state.value) ? null : "error";
    }

    validateEthAddress() {
        if (this.state.value.length >= 2 && !this.state.value.startsWith("0x")) return 'error';
        else if (this.state.value.length > 0 && this.state.value.length < 32) return 'warning';
        return null;
    }

    render() {
        return (
            <FormGroup validationState={this.getValidationState()}>
                <ControlLabel>{this.props.label}</ControlLabel>
                <FormControl type="text" placeholder={this.props.placeholder} id={this.props.id} onChange={this.onChange} />
                <HelpBlock>{this.props.extraHelp}</HelpBlock>
            </FormGroup>
        )
    }
}

class CreateProposalForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            formValid: true
        }
        this.createProposal = this.createProposal.bind(this);
    }

    createProposal() {
        if (!this.state.formValid) {
            alert('Sorry please check the inputs!');
        }
    }

    stateChanged(key, value, formValid) {
        var state = {};
        state[key] = value;
        state['formValid'] = this.state['formValid'] && formValid
        this.setState(state, function() {
            console.log(this.state);
        });
    }

    render() {
        return (
            <div>
                <h4>Create Proposal</h4>
                <FormInput validator="address" onChange={this.stateChanged.bind(this)}  id="lendingToken" label="Lending Token" placeholder="Enter the address" extraHelp="This is token address in hexadecimal like 0xABCDE..." />
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="lendingQuantity" label="Lending Quantity" placeholder="Enter the quantity" extraHelp="Ex: 20" />
                <FormInput validator="address" onChange={this.stateChanged.bind(this)} id="desiredToken" label="Desired Token" placeholder="Enter the address" extraHelp="This is token address in hexadecimal like 0xABCDE..." />
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="term" label="Term" placeholder="Enter the term in days" extraHelp="Ex: 15" />
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="rate" label="Rate" placeholder="Enter the rate" extraHelp="How many desired tokens for 1 lending token" />
                <FormInput validator="number" onChange={this.stateChanged.bind(this)} id="returnRate" label="Return Rate" placeholder="Enter the return rate" extraHelp="How many desired tokens for 1 lending token after contract term ends" />
                <Button bsStyle="primary" onClick={this.createProposal}>Create</Button>
            </div>
        )
    }
}

ReactDOM.render(
    <CreateProposalForm />,
    document.getElementById('content')
)
