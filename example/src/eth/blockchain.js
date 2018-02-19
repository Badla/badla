import Web3 from 'web3';
import Promise from 'promise'

class BlockChain {

    web3 : Web3
    confirmationBlockCount : Int
    accounts : Array

    constructor() {
        this.web3 = new Web3(window.web3.currentProvider);
        this.confirmationBlockCount = 0
    }

    getTransactionStatus(hash) : Promise {
        return new Promise((fulfill, reject) => {
            this.web3.eth.getTransaction(hash, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    var blockNumber = res.blockNumber;
                    fulfill([blockNumber != null, blockNumber]);
                }
            })
        })
    }

    getCurrentBlock() {
        return new Promise((fulfill, reject)=> {
            this.web3.eth.getBlockNumber((err, res) => {
                if (err) {
                    reject(err);
                } else {
                    fulfill(res);
                }
            })
        })
    }

    waitForFurtherBlocksToBeMined(fulfill, reject, minedBlock, extraBlockCount) {
        setTimeout(() => {
            this.getCurrentBlock().then((currentBlock) => {
                if (!currentBlock) {
                    reject();
                } else if ((currentBlock - minedBlock) >= extraBlockCount){
                    fulfill()
                } else {
                    this.waitForFurtherBlocksToBeMined(fulfill, reject, minedBlock, extraBlockCount)
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
                    this.waitForFurtherBlocksToBeMined(fulfill, reject, result[1], this.confirmationBlockCount);
                } else {
                    this.checkTransactionStatusInLoop(hash, fulfill, reject, blockNumber);
                }
            }).catch((e) => {
                reject(e);
            })
        }, 2000)
    }

    waitUntilMined(hash) : Promise {
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
            this.web3.eth.getAccounts((err, res)=> {
                if (err) {
                    reject(err)
                } else {
                    fulfill(res)
                }
            });
        })
    }

    createContractFromABI(abi) {
        return this.web3.eth.contract(abi);
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

    transferEther(from, to, amount) {
        return new Promise((fulfill, reject) => {
            this.web3.eth.sendTransaction({from:from,to:to,value:this.web3.toWei(amount),gas:500000}, (e, res) => {
                if (e) {
                    reject("Ether transfer failed")
                } else {
                    fulfill(res)
                }
            });
        });
    }

    toWei(ether) {
        return this.web3.toWei(ether);
    }
}

export default BlockChain
