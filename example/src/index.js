import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import CreateProposalForm from './create-proposal-form'
import FetchProposalForm from './fetch-proposal-form'
import { BrowserRouter, Link, Route } from 'react-router-dom'
import { Alert, Nav } from 'react-bootstrap';

const NoMetaMask = () => {
    return (
        <Alert bsStyle="danger">
            <p className="center fullHeight">
            Badla needs metamask plugin installed in your browser and intialized.
            Please visit&nbsp;<a target="_blank" href="https://metamask.io">metamask.io</a>
            <br />
            <img className="metamaskDownload" src="download-metamask-dark.png" width="200" />
            </p>
        </Alert>
    )
}

const App = () => {
    return (
        <BrowserRouter>
            <div className="fullHeight main">
                <Nav>
                    <div className="navitem"><Link to="/create">Create Proposal</Link></div>
                    <div className="navitem"><Link to="/fetch">Find Proposal</Link></div>
                </Nav>
                <div className="page">
                    <Route path="/create" component={CreateProposalForm}/>
                    <Route path="/fetch" component={FetchProposalForm}/>
                </div>
            </div>
        </BrowserRouter>
    )
}

class AppLoader extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.initialize()
    }

    initialize() {
        var web3 = window.web3;
        var account = web3.eth.accounts[0];
        //Show account hash
        //Show ERCX Bal
        //Show DWETH Bal
        setTimeout(() => {
            this.setState({initialized:true});
        }, 2000)
    }

    render() {
        return (
            <div>{ this.state.initialized ? <App /> : <div className="center"><img src="ajax-loader.gif" /></div>}</div>
        )
    }
}


ReactDOM.render(
    <div>{ window.web3 ? <AppLoader /> : <NoMetaMask /> }</div>,
    document.getElementById('content')
)
