import ABI from './abi'
import BlockChain from './blockchain'
import hash from 'string-hash'
import UUID from 'node-uuid'
import observer from 'node-observer'

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

    constructor(eventsCallback) {
        this.blockChain = new BlockChain();
        var ERCXTokenContract = this.blockChain.createContractFromABI(ABI.ERCXTokenABI);
        var BadlaContract = this.blockChain.createContractFromABI(ABI.BadlaABI);
        this.Badla = BadlaContract.at(ABI.BadlaAddress);
        this.WETHToken = ERCXTokenContract.at(ABI.WETHTokenAddress);
        this.ERCXToken = ERCXTokenContract.at(ABI.ERCXTokenAddress);
        if (eventsCallback) {
            this.Badla.allEvents((error, event) => {
                if (error) {
                    console.error(error);
                    eventsCallback(error);
                    return;
                }
                console.log(event);
                eventsCallback(event);
            });
        }
    }

    getWETHTokenBalanceOf(address) {
        return this.getTokenBalanceOf(this.WETHToken, address);
    }

    getERCXTokenBalanceOf(address) {
        return this.getTokenBalanceOf(this.ERCXToken, address);
    }

    getTokenBalanceOf(token, address) {
        return new Promise((succ, err) => {
            token.balanceOf(address, (e, res) => {
                if (e) {
                    err(e)
                } else {
                    succ(res.toString(10))
                }
            });
        });
    }

    getBadlaWalletWETHTokenBalanceOf(address) {
        return this.getBadlaWalletBalanceOf(ABI.WETHTokenAddress, address);
    }

    getBadlaWalletERCXTokenBalanceOf(address) {
        return this.getBadlaWalletBalanceOf(ABI.ERCXTokenAddress, address);
    }

    withdrawERCX() {
        return new Promise((succ, err) => {
            this.Badla.withdraw(ABI.ERCXTokenAddress, {from:this.blockChain.currentAccount()}, (e, res) => {
                if (e) {
                    err(e)
                } else {
                    succ()
                }
            });
        });
    }

    withdrawWETH() {
        return new Promise((succ, err) => {
            this.Badla.withdraw(ABI.WETHTokenAddress, {from:this.blockChain.currentAccount()}, (e, res) => {
                if (e) {
                    err(e)
                } else {
                    succ()
                }
            });
        });
    }

    getBadlaWalletBalanceOf(tokenAddress, address) {
        return new Promise((succ, err) => {
            this.Badla.balanceOf(tokenAddress, {from:address}, (e, res) => {
                if (e) {
                    err(e)
                } else {
                    succ(res.toString(10))
                }
            });
        });
    }

    approve(token, quantity) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            token.approve(ABI.BadlaAddress, quantity, {from:account}, (e, res) => {
                if (e) {
                    err("Could not get token approval")
                } else {
                    observer.send(this, "UpdateBalances");
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
                    observer.send(this, "UpdateBalances");
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
            statusCallback(5, "Waiting for token approval");
            this.approve(this.WETHToken, quantity).then((transactionId) => {
                statusCallback(30, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(60, "Creating proposal");
                return this._createProposal(proposalId, quantity, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo);
            }).then((transactionId) => {
                statusCallback(90, "Proposal created. Verifying...");
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
        var badlaProperties = ["banker","player","token1Address","vol","token2Address","nearLegPrice","term","farLegPrice","triggerPrice","priceURL","isReverseRepo","status","startTime"];
        var prettyProposal = {id:proposalId};
        rawArray.forEach((value, index) => {
            var key = badlaProperties[index];
            prettyProposal[key] = value;
        })
        prettyProposal["statusFriendly"] = this.Status[prettyProposal["status"]];
        return prettyProposal;
    }

    _cancelProposal(proposalId) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.Badla.cancelProposal(proposalId, {from:account}, (e, res) => {
                if (e) {
                    err("Cancel proposal failed")
                } else {
                    observer.send(this, "UpdateBalances");
                    succ(res);
                }
            });
        });
    }

    cancelProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Cancelling proposal...");
            this._cancelProposal(proposal.id).then((tid)=>{
                statusCallback(80, "Cancelled proposal. Verifying...");
                return this.blockChain.waitUntilMined(tid);
            }).then(() => {
                succ();
            }).catch((e)=>{
                err(e);
            });
        });
    }

    _acceptProposal(proposalId) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.Badla.acceptProposal(proposalId, {from:account}, (e, res) => {
                if (e) {
                    err("Accept proposal failed")
                } else {
                    observer.send(this, "UpdateBalances");
                    succ(res);
                }
            });
        });
    }

    acceptProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Awaiting token approval...");
            this.approve(this.ERCXToken, (proposal.nearLegPrice * proposal.vol)).then((transactionId) => {
                statusCallback(30, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(()=>{
                statusCallback(60, "Accepting proposal...");
                return this._acceptProposal(proposal.id);
            }).then((tid)=>{
                statusCallback(90, "Proposal accepted. Verifying...");
                return this.blockChain.waitUntilMined(tid);
            }).then(() => {
                succ();
            }).catch((e)=>{
                err(e);
            });
        });
    }

    _settleProposal(proposalId) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.Badla.settleProposal(proposalId, {from:account}, (e, res) => {
                if (e) {
                    err("Settle proposal failed")
                } else {
                    observer.send(this, "UpdateBalances");
                    succ(res);
                }
            });
        });
    }

    settleProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Settling proposal...");
            this.approve(this.WETHToken, proposal.vol.toString()).then((transactionId) => {
                statusCallback(20, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(()=> {
                statusCallback(40, "Settling proposal...");
                return this._settleProposal(proposal.id);
            }).then((tx)=>{
                statusCallback(80, "Proposal settled. Verifying...");
                return this.blockChain.waitUntilMined(tx);
            }).then(()=>{
                succ()
            }).catch((e) => {
                err(e)
            });
        });
    }

    _forceCloseOnPrice(proposalId) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.Badla.forceCloseOnPrice(proposalId, {from:account, value:this.blockChain.toWei(1)}, (e, res) => {
                if (e) {
                    err("Force close proposal on price failed")
                } else {
                    observer.send(this, "UpdateBalances");
                    succ(res);
                }
            });
        });
    }

    forceCloseOnPrice(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Getting transaction fees for oracle services");
            this._forceCloseOnPrice(proposal.id).then((tx)=>{
                statusCallback(80, "Proposal force closed. Verifying...");
                return this.blockChain.waitUntilMined(tx);
            }).then(()=>{
                succ()
            }).catch((e) => {
                err(e)
            });
        });
    }

    _forceCloseOnExpiry(proposalId) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.Badla.forceCloseOnExpiry(proposalId, {from:account, value:this.blockChain.toWei(1)}, (e, res) => {
                if (e) {
                    err("Force close proposal on expiry failed")
                } else {
                    observer.send(this, "UpdateBalances");
                    succ();
                }
            });
        });
    }

    forceCloseOnExpiry(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Force closing proposal on expiry...");
            this._forceCloseOnExpiry(proposal.id).then((tx)=>{
                statusCallback(80, "Force closed proposal. Verifying...");
                return this.blockChain.waitUntilMined(tx);
            }).then(()=>{
                succ()
            }).catch((e) => {
                err(e)
            });
        });
    }
}

export default Badla
