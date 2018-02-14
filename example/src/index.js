import React from 'react'
import ReactDOM from 'react-dom'
import CreateProposalForm from './forms/create-proposal-form'
import FetchProposalForm from './forms/fetch-proposal-form'
import { BrowserRouter, Link, Route } from 'react-router-dom'
import { Alert, Nav, ListGroup, ListGroupItem, Button, Glyphicon} from 'react-bootstrap'
import BadlaJS from './eth/badla'
import observer from 'node-observer'
import ABI from './eth/abi'

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
                        <Wallet loading={this.props.loading} data={this.props.data} />
                    </div>
                </div>
            </BrowserRouter>
        )
    }
}

class Wallet extends React.Component {

    badla : BadlaJS

    constructor(props) {
        super(props);
        this.state = {
            withdrawingERCX:false,
            withdrawingWETH:false
        };
        this.badla = new BadlaJS();
    }

    withdrawERCX() {
        this.setState({withdrawingERCX:true});
        this.badla.withdrawERCX().then(()=>{
            this.setState({withdrawingERCX:false});
            observer.send(this, "UpdateBalances");
        }).catch(()=>{
            this.setState({withdrawingERCX:false});
        });
    }

    withdrawWETH() {
        this.setState({withdrawingWETH:true});
        this.badla.withdrawWETH().then(()=>{
            this.setState({withdrawingWETH:false});
            observer.send(this, "UpdateBalances");
        }).catch(()=>{
            this.setState({withdrawingWETH:false});
        });
    }

    render() {
        return (
            <div className="balances">
                <ListGroup>
                    <ListGroupItem bsStyle="warning">
                        My MetaMask
                        {this.props.loading && <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" />}
                    </ListGroupItem>
                    <ListGroupItem bsStyle="success">Ether: {this.props.data.ether}</ListGroupItem>
                    <ListGroupItem bsStyle="info">WETH : {this.props.data.WETH}</ListGroupItem>
                    <ListGroupItem>ERCX : {this.props.data.ERCX}</ListGroupItem>
                </ListGroup>
                <ListGroup>
                    <ListGroupItem bsStyle="warning">
                        My Badla Wallet
                        {this.props.loading && <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" />}
                    </ListGroupItem>
                    <ListGroupItem bsStyle="info">WETH : {this.props.data.BadlaWETH}
                        <Button bsStyle="link" className="right-align" onClick={this.withdrawWETH.bind(this)}>
                            {this.state.withdrawingWETH ? <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" /> : <Glyphicon glyph="import" /> }
                        </Button>
                    </ListGroupItem>
                    <ListGroupItem>ERCX : {this.props.data.BadlaERCX}
                        <Button bsStyle="link" className="right-align" onClick={this.withdrawERCX.bind(this)}>
                            {this.state.withdrawingERCX ? <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" /> : <Glyphicon glyph="import" /> }
                        </Button>
                    </ListGroupItem>
                </ListGroup>
                <ListGroup>
                    <ListGroupItem bsStyle="warning">
                        Badla Contract Holdings
                        {this.props.loading && <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" />}
                    </ListGroupItem>
                    <ListGroupItem bsStyle="info">WETH : {this.props.data.BadlaContractWETH}</ListGroupItem>
                    <ListGroupItem>ERCX : {this.props.data.BadlaContractERCX}</ListGroupItem>
                </ListGroup>
            </div>
        );
    }
}

class AppLoader extends React.Component {

    badla : BadlaJS

    constructor(props) {
        super(props);
        this.badla = new BadlaJS();
        this.state = {};
        observer.subscribe(this, "UpdateBalances", (who, data) => {
            this.loadWalletData()
        });
    }

    componentDidMount() {
        this.loadWalletData();
    }

    loadWalletData() {
        this.setState({loading:true});
        var blockChain = this.badla.blockChain;
        var account = blockChain.currentAccount();
        var data = {};
        blockChain.balanceOf(account).then((balance)=>{
            data["ether"] = parseFloat(balance).toFixed(8);
            return this.badla.getWETHTokenBalanceOf(account);
        }).then((balance)=>{
            data["WETH"] = balance;
            return this.badla.getERCXTokenBalanceOf(account);
        }).then((balance)=> {
            data["ERCX"] = balance;
            return this.badla.getWETHTokenBalanceOf(ABI.BadlaAddress);
        }).then((balance)=>{
            data["BadlaContractWETH"] = balance;
            return this.badla.getERCXTokenBalanceOf(ABI.BadlaAddress);
        }).then((balance)=> {
            data["BadlaContractERCX"] = balance;
            return this.badla.getBadlaWalletWETHTokenBalanceOf(account);
        }).then((balance)=>{
            data["BadlaWETH"] = balance;
            return this.badla.getBadlaWalletERCXTokenBalanceOf(account);
        }).then((balance)=> {
            data["BadlaERCX"] = balance;
            this.setState({data:data, initialized:true, loading:false});
        }).catch((err)=> {
            console.err(err);
            this.setState({loading:false, initialized:true});
        });
    }

    render() {
        return (
            <div>{ this.state.initialized ? <App loading={this.state.loading} data={this.state.data} /> : <div className="center"><img alt="loading..." src="ajax-loader.gif" /></div>}</div>
        )
    }
}


ReactDOM.render(
    <div>{ window.web3 ? <AppLoader /> : <NoMetaMask /> }</div>,
    document.getElementById('content')
)
