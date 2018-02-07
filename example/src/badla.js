import React from 'react';
import Web3 from 'web3';
import ABI from './abi'
const web3 = new Web3(window.web3.currentProvider);

class Badla {

    BadlaAddress = "0x9015f742d0681173f3dd7288840bc399d8fa61ae"
    WETHAddress = "0xe5a623180c3092e0930dea774da15ccd146131ce"
    ER20TokenAddress = "0x60b6a6dc49f2e89d5758f160fa1aa906a37da5e6"
    Badla : Object
    ERCXToken : Object
    DWETHToken : Object

    construtor() {
        alert(1)
        var ERCXTokenContract = web3.eth.contract(ABI.ERCXTokenABI);
        var BadlaContract = web3.eth.contract(ABI.BadlaABI);
        this.DWETHToken = ERCXTokenContract.at(this.WETHAddress);
        this.ERCXToken = ERCXTokenContract.at(this.ER20TokenAddress);
        this.Badla = BadlaContract.at(this.BadlaAddress);
    }

}

export default Badla
