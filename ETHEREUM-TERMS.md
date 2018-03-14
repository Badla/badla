# Ethereum Terms

### Gas, Gas Price and Gas Limit

* `Gas` - Amount of fuel to be spent in executing a transaction based on the code to be executed in it.

* `Gas Price` - Cost of 1 gas in ether (specified in Giga Wei or GWEI).
<br>Ex: `1 gas = 20 GWEI`. To get current gas price try `web3.eth.gasPrice`

* `Gas Limit`
    * `Transaction` - Since gas that is consumed by a transaction cannot be accurately pre-estimated, an upper limit is typically set to make sure the transaction is with in budget and won't run away consuming all the ether in the account

    * `Block` - There is upper limit for net gas that can be consumed by all transactions in a block determined algorithmically. This is to ensure that block sizes are small enough and new blocks can be created easily (if limit is reasonable) ensuring distributed nature of blockchain.
    <br>To check current block gas limit try -
    <br>`web3.eth.getBlock('latest').gasLimit`

### Typical gas errors and how to handle

#### Out of gas
`Desc:` The gas consumed by transaction exceed the limits specified by either the transaction call or by some parameter in the connection configuration.
<br>Ex: Truffle's  `tuffle.js` has gas parameters
<br>`Soln:` Set transaction gas limit (not gas price) to latest block gas limit (`web3.eth.getBlock('latest').gasLimit`). In `truffle.js`, the config parameter is called `gas`

#### Exceeds block gas limit
`Desc:` The transaction gas limit specified exceeds block gas limit and hence the transaction cannot be accommodated in a single block. Check current block gas limit and break down the transaction to multiple transactions to lower gas required per transaction to within a block gas limit and thus it can span multiple blocks. Alternately raise block gas limit (how?).
