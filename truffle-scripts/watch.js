// Run this script from truffle console as "exec path/to/watch.js"
module.exports = function(callback) {
    const ABI = require('./generated/abi.json');
    const badlaABI = ABI.BadlaABI;
    const badlaAddress = ABI.badlaAddress;

    var contract = web3.eth.contract(badlaABI);
    var contractInstance = contract.at(badlaAddress);
    contractInstance.LogError(function(err, res) {
        console.log(JSON.stringify(res));
    });
    console.log("Looking for LogError events in Badla. Will output on console when event is raised!")
    callback();
}