import Web3 from 'web3';
import Promise from 'promise'

class Transaction {

    web3 : Web3

    constructor(provider) {
        this.web3 = new Web3(provider);
    }

    approve(from, to, amount) : Promise  {
        return new Promise(function(fulfill, reject) {

        })
    }

    getTransactionStatus(hash) : Promise {
        return new Promise(function(fulfill, reject) {
            this.web3.eth.getTransaction(hash, function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    var blockNumber = res.blockNumber;
                    fulfill(blockNumber != null);
                }
            })
        }.bind(this))
    }

    checkTransactionStatusInLoop(hash, fulfill) {
        setTimeout(function() {
            this.getTransactionStatus(hash).then(function(success) {
                if (success) {
                    fulfill(success);
                } else {
                    this.checkTransactionStatusInLoop(hash, fulfill);
                }
            })
        }.bind(this), 2000)
    }

    waitUntilMined(hash) : Promise {
        return new Promise(function(fulfill, reject) {
            this.checkTransactionStatusInLoop(hash, fulfill);
        }.bind(this))
    }

}

export default Transaction
