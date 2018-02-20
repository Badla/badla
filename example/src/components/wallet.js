import React from 'react'
import { ListGroup, ListGroupItem, Button, Glyphicon} from 'react-bootstrap'
import observer from 'node-observer'
import BadlaWeb from '../eth/badla-web'
import ABI from '../eth/abi'

class Wallet extends React.Component {

    badlaWeb : BadlaWeb

    constructor(props) {
        super(props);
        this.state = {
            withdrawingERCX:false,
            withdrawingWETH:false,
            loading:true,
            data: {
                ether:0,
                WETH:0,
                ERCX:0,
                BadlaContractEther:0,
                BadlaContractWETH:0,
                BadlaContractERCX:0,
                BadlaWETH:0,
                BadlaERCX:0
            }
        };
        this.badlaWeb = new BadlaWeb();
        this.updateBalances(this.props.accounts)

        observer.subscribe(this, "UpdateBalances", (who, data) => {
            this.updateBalances()
        });
    }

    updateBalances(accounts) {
        var blockChain = this.badlaWeb.blockChain;
        var data = {};
        var account = accounts ? accounts[0] : this.badlaWeb.blockChain.currentAccount()
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
            this.setState({data:data, loading:false});
        }).catch((err)=> {
            console.err(err);
            this.setState({loading:false});
        });
    }

    withdrawERCX() {
        this.setState({withdrawingERCX:true});
        this.badlaWeb.withdraw(ABI.ERCXTokenAddress).then(()=>{
            this.setState({withdrawingERCX:false});
            observer.send(this, "UpdateBalances");
        }).catch(()=>{
            this.setState({withdrawingERCX:false});
        });
    }

    withdrawWETH() {
        this.setState({withdrawingWETH:true});
        this.badlaWeb.withdraw(ABI.WETHTokenAddress).then(()=>{
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
                        <b>My MetaMask</b>
                        {this.state.loading && <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" />}
                    </ListGroupItem>
                    <ListGroupItem bsStyle="success">Ether: {this.state.data.ether}</ListGroupItem>
                    <ListGroupItem bsStyle="info">WETH : {this.state.data.WETH}</ListGroupItem>
                    <ListGroupItem>ERCX : {this.state.data.ERCX}</ListGroupItem>
                </ListGroup>
                <ListGroup>
                    <ListGroupItem bsStyle="warning">
                        <b>My Badla Wallet</b>
                        {this.state.loading && <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" />}
                    </ListGroupItem>
                    <ListGroupItem bsStyle="info">WETH : {this.state.data.BadlaWETH}
                        <Button bsStyle="link" className="right-align" onClick={this.withdrawWETH.bind(this)}>
                            {this.state.withdrawingWETH ? <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" /> : <Glyphicon glyph="import" /> }
                        </Button>
                    </ListGroupItem>
                    <ListGroupItem>ERCX : {this.state.data.BadlaERCX}
                        <Button bsStyle="link" className="right-align" onClick={this.withdrawERCX.bind(this)}>
                            {this.state.withdrawingERCX ? <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" /> : <Glyphicon glyph="import" /> }
                        </Button>
                    </ListGroupItem>
                </ListGroup>
                <ListGroup>
                    <ListGroupItem bsStyle="warning">
                        <b>Badla Contract Holdings</b>
                        {this.state.loading && <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" />}
                    </ListGroupItem>
                    <ListGroupItem bsStyle="success">Ether: {this.state.data.BadlaContractEther}</ListGroupItem>
                    <ListGroupItem bsStyle="info">WETH : {this.state.data.BadlaContractWETH}</ListGroupItem>
                    <ListGroupItem>ERCX : {this.state.data.BadlaContractERCX}</ListGroupItem>
                </ListGroup>
            </div>
        );
    }
}

export default Wallet
