import Web3 from 'web3';
import Promise from 'promise'
import ABI from './abi'
import observer from 'node-observer'

class BlockChain {

    web3: Web3
    minimumConfirmations: Int
    accounts: Array
    ERCXTokenContract: Object

    constructor() {
        this.web3 = new Web3(window.web3.currentProvider);
        this.ERCXTokenContract = this.createContractFromABI(ABI.ERCXTokenABI);
        this.minimumConfirmations = 0
    }

    getTransactionStatus(hash): Promise {
        return new Promise((fulfill, reject) => {
            this.web3.eth.getTransaction(hash, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    var blockNumber = res != null ? res.blockNumber : null;
                    fulfill([blockNumber != null, blockNumber]);
                }
            })
        })
    }

    getCurrentBlock() {
        return new Promise((fulfill, reject) => {
            this.web3.eth.getBlockNumber((err, res) => {
                if (err) {
                    reject(err);
                } else {
                    fulfill(res);
                }
            })
        })
    }

    waitForConfirmations(fulfill, reject, minedBlockNumber) {
        setTimeout(() => {
            this.getCurrentBlock().then((currentBlockNumber) => {
                if (!currentBlockNumber) {
                    reject();
                } else if ((currentBlockNumber - minedBlockNumber) >= this.minimumConfirmations) {
                    fulfill()
                } else {
                    this.waitForConfirmations(fulfill, reject, minedBlockNumber)
                }
            }).catch((e) => {
                reject(e);
            })
        }, 2000)
    }

    checkTransactionStatusInLoop(hash, fulfill, reject, blockNumber) {
        setTimeout(() => {
            this.getTransactionStatus(hash).then((result) => {
                if (result[0]) {
                    this.waitForConfirmations(fulfill, reject, result[1]);
                } else {
                    this.checkTransactionStatusInLoop(hash, fulfill, reject, blockNumber);
                }
            }).catch((e) => {
                reject(e);
            })
        }, 2000)
    }

    waitUntilMined(hash): Promise {
        return new Promise((fulfill, reject) => {
            if (!hash) {
                reject("Invalid transaction hash");
                return;
            }
            this.checkTransactionStatusInLoop(hash, fulfill, reject);
        })
    }

    currentAccount() {
        return this.web3.eth.accounts[0];
    }

    getAccounts() {
        return new Promise((fulfill, reject) => {
            this.web3.eth.getAccounts((err, res) => {
                if (err) {
                    reject(err)
                } else {
                    fulfill(res)
                }
            });
        })
    }

    balanceOf(address) {
        return new Promise((fulfill, reject) => {
            this.web3.eth.getBalance(address, (e, res) => {
                if (e) {
                    reject(e)
                } else {
                    fulfill(this.web3.fromWei(res).toString(10))
                }
            });
        });
    }

    tokenBalanceOf(tokenAddress, address) {
        return new Promise((succ, err) => {
            var token = this.ERCXTokenContract.at(tokenAddress)
            token.balanceOf(address, (e, res) => {
                if (e) {
                    err(e)
                } else {
                    succ(res.toString(10))
                }
            });
        });
    }

    approveToken(tokenAddress, quantity) {
        return new Promise((succ, err) => {
            let account = this.currentAccount();
            var token = this.ERCXTokenContract.at(tokenAddress)
            token.approve(ABI.BadlaAddress, quantity, {
                from: account
            }, (e, res) => {
                if (e) {
                    err("Could not get token approval")
                } else {
                    observer.send(this, "UpdateBalances");
                    succ(res)
                }
            });
        });
    }

    createContractFromABI(abi) {
        return this.web3.eth.contract(abi);
    }

    toWei(ether) {
        return this.web3.toWei(ether);
    }
}

export default BlockChain