import React from 'react'
import BadlaWeb from '../eth/badla-web'
import observer from 'node-observer'
import ABI from '../eth/abi'
import { MetaMaskNotEnabled, NoMetaMask } from './metamask'
import App from './app'

class AppLoader extends React.Component {

    badlaWebWeb : BadlaWeb

    constructor(props) {
        super(props);
        if (window.web3) {
            this.badlaWeb = new BadlaWeb(window.web3);
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
        var blockChain = this.badlaWeb.blockChain;
        blockChain.getAccounts().then((accounts)=> {
            if (accounts.length === 0) {
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
        var blockChain = this.badlaWeb.blockChain;
        var data = {};
        var account = accounts ? accounts[0] : blockChain.currentAccount()
        blockChain.balanceOf(account).then((balance)=>{
            data["ether"] = parseFloat(balance).toFixed(8);
            return blockChain.tokenBalanceOf(ABI.WETHTokenAddress, account);
        }).then((balance)=>{
            data["WETH"] = balance;
            return blockChain.tokenBalanceOf(ABI.ERCXTokenAddress, account);
        }).then((balance)=> {
            data["ERCX"] = balance;
            return blockChain.balanceOf(ABI.BadlaAddress);
        }).then((balance)=>{
            data["BadlaContractEther"] = balance;
            return blockChain.tokenBalanceOf(ABI.WETHTokenAddress, ABI.BadlaAddress);
        }).then((balance)=>{
            data["BadlaContractWETH"] = balance;
            return blockChain.tokenBalanceOf(ABI.ERCXTokenAddress, ABI.BadlaAddress);
        }).then((balance)=> {
            data["BadlaContractERCX"] = balance;
            return this.badlaWeb.balanceOf(ABI.WETHTokenAddress, account);
        }).then((balance)=>{
            data["BadlaWETH"] = balance;
            return this.badlaWeb.balanceOf(ABI.ERCXTokenAddress, account);
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
            this.state.noMetaMask ? <NoMetaMask /> :
                !this.state.accountAvailable ? <MetaMaskNotEnabled /> :
                    this.state.initialized ? <App loading={this.state.loading} data={this.state.data} /> :
                        <div className="center"><img alt="loading..." src="ajax-loader.gif" /></div>
        )
    }
}

export default AppLoader
