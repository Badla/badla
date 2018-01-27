import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { FormControl, FormGroup, HelpBlock, ControlLabel, Button } from 'react-bootstrap';

class FormInput extends React.Component {
    render() {
        return (
            <FormGroup>
                <ControlLabel>{this.props.label}</ControlLabel>
                <FormControl type="text" placeholder={this.props.placeholder} />
                <HelpBlock>{this.props.extraHelp}</HelpBlock>
            </FormGroup>
        )
    }
}

ReactDOM.render(
    <div>
        <h4>Create Proposal</h4>
        <FormInput label="Lending Token" placeholder="Enter the address" extraHelp="This is token address in hexadecimal like 0xABCDE..." />
        <FormInput label="Lending Quantity" placeholder="Enter the quantity" extraHelp="Ex: 20" />
        <FormInput label="Desired Token" placeholder="Enter the address" extraHelp="This is token address in hexadecimal like 0xABCDE..." />
        <FormInput label="Term" placeholder="Enter the term in days" extraHelp="Ex: 15" />
        <FormInput label="Rate" placeholder="Enter the rate" extraHelp="How many desired tokens for 1 lending token" />
        <FormInput label="Return Rate" placeholder="Enter the return rate" extraHelp="How many desired tokens for 1 lending token after contract term ends" />
        <Button bsStyle="primary">Create</Button>
    </div>,
    document.getElementById('content')
)
