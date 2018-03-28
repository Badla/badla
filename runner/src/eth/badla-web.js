import BlockChain from './lib/blockchain'
import Badla from './lib/badla'
import UUID from 'node-uuid'

/**
 * Interact with badla contracts from a web application using this js library
 *
 * @class BadlaWeb
 */
class BadlaWeb {
    /**
     * Reference to blockchain object which can used for querying blockchain state
     * and execute non-badla functions like checking ether balance etc
     *
     * @property blockChain
     * @type BlockChain
     */
    blockChain: BlockChain

    /**
     * Reference to badla wrapper that converts smart contract functions from callback
     * based to promise based
     *
     * @property badla
     * @type Badla
     */
    badla: Badla

    /**
     * BadlaWeb contructor
     *
     * @class BadlaWeb
     * @constructor
     * @param {Web3} web3 - Web3 object that points to a etherum node connection usually
     * from a lightnode like MetaMask
     */
    constructor(web3) {
        web3 = web3 || window.web3
        this.badla = new Badla(web3)
        this.blockChain = new BlockChain(web3);
    }

    /**
     * Find balances in badla wallet. Badla transaction that fetch tokens
     * go into badla wallet and need to be seperately withdrawn to their
     * external wallet (like MetaMask)
     *
     * @method balanceOf
     * @param {string} tokenAddress - Address of the ERC20 token contract
     * @param {string} address - Address of the account to find balance of in badla wallet
     * @return {Promise} promise that succeeds with badla wallet balance
     */
    balanceOf(tokenAddress, address) {
        return this.badla.balanceOf(tokenAddress, address);
    }

    /**
     * Withdraw balance in badla wallet of the current active account - usually
     * first account in the accounts array - eth.accounts[0] to the web3 account (Metamask account)
     *
     * @method withdraw
     * @param {string} tokenAddress - Address of the ERC20 token contract
     * @return {Promise} promise
     */
    withdraw(tokenAddress) {
        return new Promise((succ, err) => {
            this.badla.withdraw(tokenAddress).then((transactionId) => {
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                succ()
            }).catch((error) => {
                err(error)
            })
        })
    }

    /**
     * Create badla proposal
     *
     * @method createProposal
     * @param {string} tokenAddress1 - Address of the ERC20 token contract that is being lent
     * @param {number} quantity - Quantity of token being lent
     * @param {string} tokenAddress2 - Address of the ERC20 token contract that is being sought
     * @param {number} price - Offer price
     * @param {number} term - Term of the proposal after acceptance in days
     * @param {number} returnPrice - Expected return price
     * @param {number} triggerPrice - Price at which force settlement will trigger
     * @param {url} priceUrl - Oraclize url for price check to force settle
     * @param {boolean} isReverseRepo - Is it reverse repo
     * @param {string} statusCallback - Callback that notifies state of the proposal creation after each step
     * @return {Promise} promise that succeeds with proposal details
     */
    createProposal(tokenAddress1, quantity, tokenAddress2, price, term, returnPrice, triggerPrice, priceUrl, isReverseRepo, statusCallback) {
        return new Promise((succ, err) => {
            var proposalId = UUID();
            statusCallback(5, "Waiting for token approval");
            var approvalQuantity = isReverseRepo ? quantity : price * quantity;
            this.blockChain.approveToken(tokenAddress1, approvalQuantity).then((transactionId) => {
                statusCallback(30, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(60, "Creating proposal");
                return this.badla.createProposal(proposalId, tokenAddress1, quantity, tokenAddress2, price, term, returnPrice, triggerPrice, priceUrl, isReverseRepo);
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

    /**
     * Cancel badla proposal
     *
     * @method cancelProposal
     * @param {Proposal} proposal - Proposal to be cancelled
     * @param {string} statusCallback - Callback that notifies state of the proposal creation after each step
     * @return {Promise} promise
     */
    cancelProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Cancelling proposal...");
            this.badla.cancelProposal(proposal.id).then((tid) => {
                statusCallback(80, "Cancelled proposal. Verifying...");
                return this.blockChain.waitUntilMined(tid);
            }).then(() => {
                succ();
            }).catch((e) => {
                err(e);
            });
        });
    }

    /**
     * Accept badla proposal
     *
     * @method acceptProposal
     * @param {Proposal} proposal - Proposal to be accepted
     * @param {string} statusCallback - Callback that notifies state of the proposal creation after each step
     * @return {Promise} promise
     */
    acceptProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Awaiting token approval...");
            var approvalQuantity = proposal.isReverseRepo ? proposal.nearLegPrice * proposal.vol : parseInt(proposal.vol);
            this.blockChain.approveToken(proposal.token2Address, approvalQuantity).then((transactionId) => {
                statusCallback(30, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(60, "Accepting proposal...");
                return this.badla.acceptProposal(proposal.id);
            }).then((tid) => {
                statusCallback(90, "Proposal accepted. Verifying...");
                return this.blockChain.waitUntilMined(tid);
            }).then(() => {
                succ();
            }).catch((e) => {
                err(e);
            });
        });
    }

    /**
     * Settle badla proposal
     *
     * @method settleProposal
     * @param {Proposal} proposal - Proposal to be settled
     * @param {string} statusCallback - Callback that notifies state of the proposal creation after each step
     * @return {Promise} promise
     */
    settleProposal(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Settling proposal...");
            var approvalQuantity = proposal.isReverseRepo ? parseInt(proposal.vol) : proposal.farLegPrice * proposal.vol;
            this.blockChain.approveToken(proposal.token1Address, approvalQuantity).then((transactionId) => {
                statusCallback(20, "Got token approval. Verifying...");
                return this.blockChain.waitUntilMined(transactionId);
            }).then(() => {
                statusCallback(40, "Settling proposal...");
                return this.badla.settleProposal(proposal.id);
            }).then((tx) => {
                statusCallback(80, "Proposal settled. Verifying...");
                return this.blockChain.waitUntilMined(tx);
            }).then(() => {
                succ()
            }).catch((e) => {
                err(e)
            });
        });
    }

    /**
     * Force close badla proposal based on price of the oracalize url
     *
     * @method forceCloseOnPrice
     * @param {Proposal} proposal - Proposal to be force closed
     * @param {string} statusCallback - Callback that notifies state of the proposal creation after each step
     * @return {Promise} promise
     */
    forceCloseOnPrice(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Getting transaction fees for oracle services");
            this.badla.forceCloseOnPrice(proposal.id).then((tx) => {
                statusCallback(80, "Proposal force closed. Verifying...");
                return this.blockChain.waitUntilMined(tx);
            }).then(() => {
                succ()
            }).catch((e) => {
                err(e)
            });
        });
    }

    /**
     * Force close badla proposal based on term end
     *
     * @method forceCloseOnExpiry
     * @param {Proposal} proposal - Proposal to be force closed
     * @param {string} statusCallback - Callback that notifies state of the proposal creation after each step
     * @return {Promise} promise
     */
    forceCloseOnExpiry(proposal, statusCallback) {
        return new Promise((succ, err) => {
            statusCallback(5, "Force closing proposal on expiry...");
            this.badla.forceCloseOnExpiry(proposal.id).then((tx) => {
                statusCallback(80, "Force closed proposal. Verifying...");
                return this.blockChain.waitUntilMined(tx);
            }).then(() => {
                succ()
            }).catch((e) => {
                err(e)
            });
        });
    }

    /**
     * Fetch proposal details
     *
     * @method fetchProposal
     * @param {Number} proposalId - Proposal Id
     * @return {Proposal} proposal
     */
    fetchProposal(proposalId) {
        return this.badla.fetchProposal(proposalId)
    }

    /**
     * Get proposal status deascription
     *
     * @method getStatusDescription
     * @param {Number} id - Status id found in proposal
     * @return {String} Description
     */
    getStatusDescription(id) {
        return this.badla.Status[id]
    }
}

export default BadlaWeb