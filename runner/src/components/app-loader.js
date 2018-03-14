import React from 'react'
import BadlaWeb from '../eth/badla-web'
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
            this.setState({accountAvailable:true, accounts:accounts, initialized:true});
        }).catch((err)=> {
            console.err(err);
            this.setState({accountAvailable:false, loading:false, initialized:true});
        })
    }

    render() {
        return (
            this.state.noMetaMask ? <NoMetaMask /> :
                !this.state.accountAvailable ? <MetaMaskNotEnabled /> :
                    this.state.initialized ? <App accounts={this.state.accounts} /> :
                        <div className="center"><img alt="loading..." src="ajax-loader.gif" /></div>
        )
    }
}

export default AppLoader
