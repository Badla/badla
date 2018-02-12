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
            this.WETHToken.approve(ABI.BadlaAddress, quantity, {from:account}, (e, res) => {
                if (e) {
                    err("Could not get token approval")
                } else {
                    succ(res)
                }
            });
        });
    }

    _createProposal(proposalId, quantity, price, term, returnPrice, triggerPrice, priceUrl) {
        return new Promise((succ, err) => {
            let account = this.web3.eth.accounts[0];
            this.Badla.createProposal(proposalId, ABI.WETHTokenAddress, quantity, ABI.ERCXTokenAddress, price, term, returnPrice, triggerPrice, priceUrl, {from:account}, (e, res) => {
                if (e) {
                    err("Could not create proposal")
                } else {
                    succ(res)
                }
            });
        });
    }

    getProposalFromTokenId(tokenId) {
        return new Promise((succ, err) => {
            this.Badla.tokenToProposalIds(tokenId, (e, res) => {
                if (e) {
                    err("Proposal is created but could not fetch id. Token Id - \""+tokenId+"\"");
                } else {
                    succ(res);
                }
            });
        });
    }

    UUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }


    createProposal(quantity, price, term, returnPrice, triggerPrice, priceUrl, statusCallback) {
        return new Promise((succ, err) => {
            var proposalId = this.UUID();
            statusCallback(0, "Waiting for token approval");
            this.approve(quantity).then((transactionId) => {
                statusCallback(20, "Got token approval. Verifying...");
                return this.transaction.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(30, "Creating proposal");
                return this._createProposal(proposalId, quantity, price, term, returnPrice, triggerPrice, priceUrl);
            }).then((transactionId) => {
                statusCallback(70, "Proposal created. Verifying...");
                return this.transaction.waitUntilMined(transactionId);
            }).then(() => {
                succ(proposalId)
            }).catch((msg) => {
                err(msg)
            });
        });
    }
}

export default Badla
