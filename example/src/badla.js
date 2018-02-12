import Web3 from 'web3';
import ABI from './abi'
import Transaction from './transaction'

class Badla {

    transaction : Transaction
    web3 : Web3
    DWETHToken : ERCXTokenContract
    ERCXToken : ERCXTokenContract
    Badla : BadlaContract

    constructor() {
        this.web3 = new Web3(window.web3.currentProvider);
        this.transaction = new Transaction(this.web3);
        var ERCXTokenContract = this.web3.eth.contract(ABI.ERCXTokenABI);
        var BadlaContract = this.web3.eth.contract(ABI.BadlaABI);
        this.Badla = BadlaContract.at(ABI.BadlaAddress);
        this.WETHToken = ERCXTokenContract.at(ABI.WETHTokenAddress);
        this.ERCXToken = ERCXTokenContract.at(ABI.ERCXTokenAddress);
    }

    approve(quantity) {
        return new Promise((succ, err) => {
            let account = this.web3.eth.accounts[0];
            this.WETHToken.approve(ABI.BadlaAddress, quantity, {from:account}, (err, res) => {
                if (err) {
                    err("Could not get token approval")
                } else {
                    succ(res)
                }
            });
        });
    }

    _createProposal(quantity, price, term, returnPrice, triggerPrice) {
        return new Promise((succ, err) => {
            let account = this.web3.eth.accounts[0];
            let tokenId = Math.floor(Math.random() * 1000);
            this.Badla.createProposal(tokenId, ABI.WETHTokenAddress, quantity, ABI.ERCXTokenAddress, price, term, returnPrice, triggerPrice, {from:account}, (e, res) => {
                if (e) {
                    err("Could not create proposal")
                } else {
                    succ({tokenId:tokenId, transactionId:res})
                }
            });
        });
    }

    getProposalFromTokenId(tokenId) {
        return new Promise((succ, err) => {
            this.Badla.tokenToProposalIds(tokenId, (err, res) => {
                if (err) {
                    err("Proposal is created but could not fetch id. Token Id - \""+tokenId+"\"");
                } else {
                    succ(res);
                }
            });
        });
    }

    createProposal(quantity, price, term, returnPrice, triggerPrice, statusCallback) {
        return new Promise((succ, err) => {
            var tokenId;
            statusCallback(0, "Waiting for token approval");
            this.approve(quantity).then((transactionId) => {
                statusCallback(20, "Got token approval. Verifying...");
                return this.transaction.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(30, "Creating proposal");
                return this._createProposal(quantity, price, term, returnPrice, triggerPrice);
            }).then((res) => {
                tokenId = res.tokenId;
                statusCallback(70, "Proposal created. Verifying...");
                return this.transaction.waitUntilMined(res.transactionId);
            }).then(() => {
                statusCallback(90, "Getting proposal id...");
                return this.getProposalFromTokenId(tokenId);
            }).then((proposalId) => {
                succ(proposalId)
            }).catch((msg) => {
                err(msg)
            });
        });
    }
}

export default Badla
