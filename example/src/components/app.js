import CreateProposalForm from '../forms/create-proposal-form'
import FetchProposalForm from '../forms/fetch-proposal-form'
import { BrowserRouter, Link, Route, DefaultRoute } from 'react-router-dom'
import { Alert, Nav, Glyphicon} from 'react-bootstrap'
import BadlaJS from '../eth/badla'
import Wallet from './wallet'
import observer from 'node-observer'
import React from 'react'
import ABI from '../eth/abi'
import ReactDOM from 'react-dom'

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

const MetaMaskNotEnabled = () => {
    return (
        <Alert bsStyle="danger" className="center">Please open metamask and unlock wallet or add some accounts</Alert>
    )
}

class App extends React.Component {
    render() {
        return (
            <BrowserRouter>
                <div className="fullHeight main">
                    <Nav>
                        <div className="navitem"><Link to="/create"><Glyphicon glyph="plus" />{" "}Create Proposal</Link></div>
                        <div className="navitem"><Link to="/fetch"><Glyphicon glyph="search" />{" "}Find Proposal</Link></div>
                    </Nav>
                    <div className="page">
                        <Route path="/create" component={CreateProposalForm}/>
                        <Route path="/fetch" component={FetchProposalForm}/>
                        <Route exact path="/" render={() => (
                            <p className="center">
                                <h3>Welcome to Badla.IO</h3>
                                <h5>Please select from menu</h5>
                            </p>
                        )}/>
                        <Wallet loading={this.props.loading} data={this.props.data} />
                    </div>
                </div>
            </BrowserRouter>
        )
    }
}

class AppLoader extends React.Component {

    badla : BadlaJS

    constructor(props) {
        super(props);
        if (window.web3) {
            this.badla = new BadlaJS(window.web3);
        }
        this.state = {
            noMetaMask:!window.web3,
            accountAvailable:false,
            loading:true,
            initialized:false
        };
        observer.subscribe(this, "UpdateBalances", (who, data) => {
            this.loadWalletData()
        });
    }

    componentDidMount() {
        if (!window.web3) {
            return;
        }
        var blockChain = this.badla.blockChain;
        blockChain.getAccounts().then((accounts)=> {
            if (accounts.length == 0) {
                this.setState({accountAvailable:false, loading:false, initialized:true});
                return
            }
            this.setState({accountAvailable:true}, ()=> {
                this.loadWalletData(accounts);
            });
        }).catch((err)=> {
            console.err(err);
            this.setState({accountAvailable:false, loading:false, initialized:true});
        })
    }

    loadWalletData(accounts) {
        var blockChain = this.badla.blockChain;
        var data = {};
        var account = accounts ? accounts[0] : blockChain.currentAccount()
        blockChain.balanceOf(account).then((balance)=>{
            data["ether"] = parseFloat(balance).toFixed(8);
            return this.badla.getWETHTokenBalanceOf(account);
        }).then((balance)=>{
            data["WETH"] = balance;
            return this.badla.getERCXTokenBalanceOf(account);
        }).then((balance)=> {
            data["ERCX"] = balance;
            return blockChain.balanceOf(ABI.BadlaAddress);
        }).then((balance)=>{
            data["BadlaContractEther"] = balance;
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
            <div>{
                this.state.noMetaMask ? <NoMetaMask /> :
                    !this.state.accountAvailable ? <MetaMaskNotEnabled /> :
                        this.state.initialized ? <App loading={this.state.loading} data={this.state.data} /> :
                            <div className="center"><img alt="loading..." src="ajax-loader.gif" /></div>
            }</div>
        )
    }
}

export default AppLoader
