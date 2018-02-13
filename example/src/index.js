import React from 'react'
import ReactDOM from 'react-dom'
import CreateProposalForm from './forms/create-proposal-form'
import FetchProposalForm from './forms/fetch-proposal-form'
import { BrowserRouter, Link, Route } from 'react-router-dom'
import { Alert, Nav, ListGroup, ListGroupItem } from 'react-bootstrap'
import BadlaJS from './eth/badla'

const NoMetaMask = () => {
    return (
        <Alert bsStyle="danger">
            <p className="center fullHeight">
            Badla needs metamask plugin installed in your browser and intialized.
            Please visit&nbsp;<a target="_blank" rel="noopener noreferrer" href="https://metamask.io">metamask.io</a>
            <br />
            <img alt="metamask-logo" className="metamaskDownload" src="download-metamask-dark.png" width="200" />
            </p>
        </Alert>
    )
}

class App extends React.Component {
    render() {
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
                        <div className="balances">
                            <ListGroup>
                                <ListGroupItem bsStyle="warning">MetaMask</ListGroupItem>
                                <ListGroupItem bsStyle="success">Ether: {this.props.data.ether}</ListGroupItem>
                                <ListGroupItem bsStyle="info">WETH : {this.props.data.WETH}</ListGroupItem>
                                <ListGroupItem bsStyle="default">ERCX : {this.props.data.ERCX}</ListGroupItem>
                            </ListGroup>
                            <ListGroup>
                                <ListGroupItem bsStyle="warning">Badla Wallet</ListGroupItem>
                                <ListGroupItem bsStyle="info">WETH : {this.props.data.BadlaWETH}</ListGroupItem>
                                <ListGroupItem bsStyle="default">ERCX : {this.props.data.BadlaERCX}</ListGroupItem>
                            </ListGroup>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        )
    }
}

class AppLoader extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.initialize()
    }

    initialize() {
        var badla = new BadlaJS();
        var blockChain = badla.blockChain;
        var account = blockChain.currentAccount();
        var data = {};
        blockChain.balanceOf(account).then((balance)=>{
            data["ether"] = parseFloat(balance).toFixed(8);
            return badla.getWETHTokenBalanceOf(account);
        }).then((balance)=>{
            data["WETH"] = balance;
            return badla.getERCXTokenBalanceOf(account);
        }).then((balance)=> {
            data["ERCX"] = balance;
            return badla.getBadlaWalletWETHTokenBalanceOf(account);
        }).then((balance)=>{
            data["BadlaWETH"] = balance;
            return badla.getBadlaWalletERCXTokenBalanceOf(account);
        }).then((balance)=> {
            data["BadlaERCX"] = balance;
            this.setState({data:data, initialized:true});
        }).catch((err)=> {
            console.err(err);
            this.setState({initialized:true});
        });
    }

    render() {
        return (
            <div>{ this.state.initialized ? <App data={this.state.data} /> : <div className="center"><img alt="loading..." src="ajax-loader.gif" /></div>}</div>
        )
    }
}


ReactDOM.render(
    <div>{ window.web3 ? <AppLoader /> : <NoMetaMask /> }</div>,
    document.getElementById('content')
)
