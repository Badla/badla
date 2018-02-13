import Web3 from 'web3';
import Promise from 'promise'

class BlockChain {

    web3 : Web3

    constructor(web3) {
        this.web3 = web3;
    }

    getTransactionStatus(hash) : Promise {
        return new Promise((fulfill, reject) => {
            this.web3.eth.getTransaction(hash, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    var blockNumber = res.blockNumber;
                    fulfill(blockNumber != null);
                }
            })
        })
    }

    checkTransactionStatusInLoop(hash, fulfill, reject) {
        setTimeout(() => {
            this.getTransactionStatus(hash).then((success) => {
                if (success) {
                    fulfill(success);
                } else {
                    this.checkTransactionStatusInLoop(hash, fulfill);
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

}

export default BlockChain
