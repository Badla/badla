import React from 'react';
import { FormControl, FormGroup, HelpBlock, ControlLabel } from 'react-bootstrap';

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
            "url" : this.validateUrl.bind(this),
            "nothingValidator" : function() { return null; }
        }
    }

    onChange(event) {
        this.setState({value:event.target.value}, () => {
            this.props.onChange(this.props.id, this.state.value, this.getValidationState() == null && this.state.value.length > 0)
        });
    }

    componentDidMount() {
        if (this.props.value) {
            this.onChange({target:{value:this.props.value}})
        }
    }

    getValidationState() {
        var validator = this.props.validator || "nothingValidator";
        return this.validators[validator]();
    }

    validateNumber() {
        return this.state.value.length === 0 || /^\d+$/.test(this.state.value) ? null : "error";
    }

    validateUrl() {
        return this.state.value.length === 0 || /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/.test(this.state.value) ? null : "error";
    }

    validateEthAddress() {
        if (this.state.value.length >= 2 && !this.state.value.startsWith("0x")) return 'error';
        else if (this.state.value.length > 0 && this.state.value.length < 32) return 'warning';
        return null;
    }

    render() {
        let value = this.state.value || this.state.value === '' ? this.state.value : this.props.value
        return (
            <FormGroup validationState={this.getValidationState()}>
                <ControlLabel className={this.props.alignClass}>{this.props.label}</ControlLabel>
                <FormControl className={this.props.alignClass} type="text" placeholder={this.props.placeholder} value={value} id={this.props.id} onChange={this.onChange}></FormControl>
                <HelpBlock className={this.props.alignClass}>{this.props.extraHelp}</HelpBlock>
            </FormGroup>
        )
    }
}

export default FormInput
