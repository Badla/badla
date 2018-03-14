var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = ""

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    networks: {
        development: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*", // Match any network id
            gas: 6721975
        },
        kovan: {
            provider: new HDWalletProvider(mnemonic, "https://kovan.infura.io/vxxrlhiTWZ8wpmooaweY"),
            network_id: 3
        },
        testNet: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*",
            gas: 4600000
        }
    }
};