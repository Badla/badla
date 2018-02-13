import Web3 from 'web3';
import ABI from './abi'
import BlockChain from './blockchain'
import hash from 'string-hash'
import UUID from 'node-uuid'

class Badla {

    blockChain : BlockChain
    web3 : Web3
    DWETHToken : ERCXTokenContract
    ERCXToken : ERCXTokenContract
    Badla : BadlaContract

    constructor() {
        this.web3 = new Web3(window.web3.currentProvider);
        this.blockChain = new BlockChain(this.web3);
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

    createProposal(quantity, price, term, returnPrice, triggerPrice, priceUrl, statusCallback) {
        return new Promise((succ, err) => {
            var proposalId = hash(UUID());
            statusCallback(0, "Waiting for token approval");
            this.approve(quantity).then((transactionId) => {
                statusCallback(20, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(30, "Creating proposal");
                return this._createProposal(proposalId, quantity, price, term, returnPrice, triggerPrice, priceUrl);
            }).then((transactionId) => {
                statusCallback(70, "Proposal created. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                return this.fetchProposal(proposalId);
            }).then((proposal) => {
                succ(proposal)
            }).catch((msg) => {
                err(msg)
            });
        });
    }

    fetchProposal(proposalId) {
        return new Promise((succ, err) => {
            this.Badla.proposals(proposalId, (e, res) => {
                if (e) {
                    err("Error in fetching proposal")
                } else if (!res[0]) {
                    err("Proposal not found")
                } else {
                    succ(this.parseProposal(proposalId, res));
                }
            });
        })
    }

    parseProposal(proposalId, rawArray) {
        var badlaProperties = ABI.BadlaABI.filter(publicProperty => publicProperty["name"] === "proposals")[0]["outputs"];
        badlaProperties = badlaProperties.map(badlaProperty => badlaProperty["name"]);
        var prettyProposal = {id:proposalId};
        rawArray.forEach((value, index) => {
            var key = badlaProperties[index];
            prettyProposal[key] = value;
        })
        delete prettyProposal["exists"];
        return prettyProposal;
    }
}

export default Badla
