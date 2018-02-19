import React from 'react'
import { ListGroup, ListGroupItem, Button, Glyphicon} from 'react-bootstrap'
import observer from 'node-observer'
import BadlaJS from '../eth/badla'

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
                        <b>My MetaMask</b>
                        {this.props.loading && <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" />}
                    </ListGroupItem>
                    <ListGroupItem bsStyle="success">Ether: {this.props.data.ether}</ListGroupItem>
                    <ListGroupItem bsStyle="info">WETH : {this.props.data.WETH}</ListGroupItem>
                    <ListGroupItem>ERCX : {this.props.data.ERCX}</ListGroupItem>
                </ListGroup>
                <ListGroup>
                    <ListGroupItem bsStyle="warning">
                        <b>My Badla Wallet</b>
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
                        <b>Badla Contract Holdings</b>
                        {this.props.loading && <img className="walletLoading" alt="loading..." src="wallet-loader.gif" width="18" height="18" />}
                    </ListGroupItem>
                    <ListGroupItem bsStyle="success">Ether: {this.props.data.BadlaContractEther}</ListGroupItem>
                    <ListGroupItem bsStyle="info">WETH : {this.props.data.BadlaContractWETH}</ListGroupItem>
                    <ListGroupItem>ERCX : {this.props.data.BadlaContractERCX}</ListGroupItem>
                </ListGroup>
            </div>
        );
    }
}

export default Wallet
