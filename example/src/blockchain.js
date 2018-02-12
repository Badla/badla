class BlockChain {

    getBlock(cb) {
        this.web3.eth.getBlock('latest', (err, res) => {
            if (err) {
                alert('Could not get latest block');
                return;
            }
            cb(res.gasLimit)
        })
    }

    getGasPrice(cb) {
        this.web3.eth.getGasPrice((err, res) => {
            if (err) {
                alert('Could not get gas price');
                return;
            }
            cb(res.toString(10))
        })
    }

}

export default BlockChain
