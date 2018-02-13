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

    Status = [
        "NEW",
        "ACCEPTED",
        "CANCELLED",
        "FORCE_CLOSING",
        "FORCE_CLOSED_EXPIRY",
        "FORCE_CLOSED_PRICE",
        "SETTLED"
    ]

    constructor() {
        this.blockChain = new BlockChain();
        var ERCXTokenContract = this.blockChain.createContractFromABI(ABI.ERCXTokenABI);
        var BadlaContract = this.blockChain.createContractFromABI(ABI.BadlaABI);
        this.Badla = BadlaContract.at(ABI.BadlaAddress);
        this.WETHToken = ERCXTokenContract.at(ABI.WETHTokenAddress);
        this.ERCXToken = ERCXTokenContract.at(ABI.ERCXTokenAddress);
    }

    approve(quantity) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.WETHToken.approve(ABI.BadlaAddress, quantity, {from:account}, (e, res) => {
                if (e) {
                    err("Could not get token approval")
                } else {
                    succ(res)
                }
            });
        });
    }

    _createProposal(proposalId, quantity, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.Badla.createProposal(proposalId, ABI.WETHTokenAddress, quantity, ABI.ERCXTokenAddress, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo, {from:account}, (e, res) => {
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

    createProposal(quantity, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo, statusCallback) {
        return new Promise((succ, err) => {
            var proposalId = UUID();
            statusCallback(0, "Waiting for token approval");
            this.approve(quantity).then((transactionId) => {
                statusCallback(20, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(30, "Creating proposal");
                return this._createProposal(proposalId, quantity, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo);
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
            this.Badla.getProposal(proposalId, (e, res) => {
                if (e) {
                    err("Proposal not found")
                } else {
                    succ(this.parseProposal(proposalId, res));
                }
            });
        })
    }

    parseProposal(proposalId, rawArray) {
        var badlaProperties = ["banker","player","cashTokenAddress","vol","tokenAddress","nearLegPrice","term","farLegPrice","triggerPrice","priceURL","isReverseRepo","status","startTime"];
        var prettyProposal = {id:proposalId};
        rawArray.forEach((value, index) => {
            var key = badlaProperties[index];
            prettyProposal[key] = value;
        })
        prettyProposal["statusFriendly"] = this.Status[prettyProposal["status"]];
        return prettyProposal;
    }

    cancelProposal(proposalId) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.Badla.cancelProposal(proposalId, {from:account}, (e, res) => {
                if (e) {
                    err("Cancel proposal failed")
                } else {
                    succ();
                }
            });
        });
    }
}

export default Badla
