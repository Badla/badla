import BlockChain from './blockchain'
import Badla from './badla'
import UUID from 'node-uuid'

class BadlaWeb {

    blockChain : BlockChain
    badla: Badla

    constructor(web3) {
        web3 = web3 || window.web3
        this.badla = new Badla(web3)
        this.blockChain = new BlockChain(web3);
    }

    balanceOf(tokenAddress, address) {
        return this.badla.balanceOf(tokenAddress, address);
    }

    withdraw(tokenAddress) {
        return new Promise((succ, err)=> {
            this.badla.withdraw(tokenAddress).then((transactionId)=>{
                return this.blockChain.waitUntilMined(transactionId);
            }).then(()=>{
                succ()
            }).catch((err)=>{
                err(err)
            })
        })
    }

    createProposal(tokenAddress1, quantity, tokenAddress2, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo, statusCallback) {
        return new Promise((succ, err) => {
            var proposalId = UUID();
            statusCallback(5, "Waiting for token approval");
            this.blockChain.approveToken(tokenAddress1, quantity).then((transactionId) => {
                statusCallback(30, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(60, "Creating proposal");
                return this.badla.createProposal(proposalId, tokenAddress1, quantity, tokenAddress2, price, term, returnPrice, triggerPrice, priceUrl, reverseRepo);
            }).then((transactionId) => {
                statusCallback(90, "Proposal created. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                return this.badla.fetchProposal(proposalId);
            }).then((proposal) => {
                succ(proposal)
            }).catch((msg) => {
                err(msg)
            });
        });
    }

    cancelProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Cancelling proposal...");
            this.badla.cancelProposal(proposal.id).then((tid)=>{
                statusCallback(80, "Cancelled proposal. Verifying...");
                return this.blockChain.waitUntilMined(tid);
            }).then(() => {
                succ();
            }).catch((e)=>{
                err(e);
            });
        });
    }

    acceptProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Awaiting token approval...");
            this.blockChain.approveToken(proposal.token2Address, (proposal.nearLegPrice * proposal.vol)).then((transactionId) => {
                statusCallback(30, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(()=>{
                statusCallback(60, "Accepting proposal...");
                return this.badla.acceptProposal(proposal.id);
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

    settleProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Settling proposal...");
            this.blockChain.approveToken(proposal.token1Address, proposal.vol.toString()).then((transactionId) => {
                statusCallback(20, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(()=> {
                statusCallback(40, "Settling proposal...");
                return this.badla.settleProposal(proposal.id);
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

    forceCloseOnPrice(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Getting transaction fees for oracle services");
            this.badla.forceCloseOnPrice(proposal.id).then((tx)=>{
                statusCallback(80, "Proposal force closed. Verifying...");
                return this.blockChain.waitUntilMined(tx);
            }).then(()=>{
                succ()
            }).catch((e) => {
                err(e)
            });
        });
    }

    forceCloseOnExpiry(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Force closing proposal on expiry...");
            this.badla.forceCloseOnExpiry(proposal.id).then((tx)=>{
                statusCallback(80, "Force closed proposal. Verifying...");
                return this.blockChain.waitUntilMined(tx);
            }).then(()=>{
                succ()
            }).catch((e) => {
                err(e)
            });
        });
    }

    fetchProposal(proposalId) {
        return this.badla.fetchProposal(proposalId)
    }

    getStatusDescription(id) {
        return this.badla.Status[id]
    }
}

export default BadlaWeb
