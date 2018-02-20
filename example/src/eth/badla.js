import ABI from './abi'
import BlockChain from './blockchain'
import observer from 'node-observer'

class Badla {

    blockChain : BlockChain
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

    constructor(web3) {
        web3 = web3 || window.web3
        this.blockChain = new BlockChain(web3);
        var BadlaContract = this.blockChain.createContractFromABI(ABI.BadlaABI);
        this.Badla = BadlaContract.at(ABI.BadlaAddress);
    }

    cancelProposal(proposalId) {
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

    acceptProposal(proposalId) {
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

    settleProposal(proposalId) {
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

    forceCloseOnPrice(proposalId) {
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

    forceCloseOnExpiry(proposalId) {
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

    createProposal(proposalId, token1Address, quantity, token2Address, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo) {
        return new Promise((succ, err) => {
            let account = this.blockChain.currentAccount();
            this.Badla.createProposal(proposalId, token1Address, quantity, token2Address, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo, {from:account}, (e, res) => {
                if (e) {
                    err("Could not create proposal")
                } else {
                    observer.send(this, "UpdateBalances");
                    succ(res)
                }
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

    withdraw(address) {
        return new Promise((succ, err) => {
            this.Badla.withdraw(address, {from:this.blockChain.currentAccount()}, (e, res) => {
                if (e) {
                    err(e)
                } else {
                    succ(res)
                }
            });
        });
    }

    balanceOf(tokenAddress, address) {
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
}

export default Badla
