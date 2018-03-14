var StringsLib = artifacts.require("./libs/StringsLib.sol");
var WalletLib = artifacts.require("./libs/WalletLib.sol");
var ProposalsLib = artifacts.require("./libs/ProposalsLib.sol");
var TokenTransferLib = artifacts.require("./libs/TokenTransferLib.sol");
var Badla = artifacts.require("./Badla.sol");
var ERCXToken = artifacts.require("./ERCXToken.sol");
var fs = require('fs');

// var Web3 = require('web3');
// var web3 = new Web3("http://localhost:7545");

module.exports = function(deployer) {
    var contractInfo = {
        BadlaABI: Badla.abi,
        ERCXTokenABI: ERCXToken.abi
    }

    var tokenCreatorAddress = 0;
    var bankerAddress = "0xEBEb62a3840Fbef657F18CeAeFB0aA93a7212736"; //web3.eth.accounts[1]; //Replace this with metamask account address
    var playerAddress = "0x402681D45482c671719823634237F2A4b246828E"; //Replace this with metamask account address
    var initialTokens = 1000;
    var initialEther = 1;

    function deployBadla() {
        return new Promise(function(succ, fail) {
            deployer.deploy(StringsLib);
            deployer.deploy(WalletLib);
            deployer.deploy(ProposalsLib);
            deployer.deploy(TokenTransferLib);
            deployer.link(StringsLib, Badla);
            deployer.link(WalletLib, Badla);
            deployer.link(ProposalsLib, Badla);
            deployer.link(TokenTransferLib, Badla);
            deployer.deploy(Badla).then(function() {
                contractInfo["BadlaAddress"] = Badla.address;
                succ();
            })
        });
    }

    function deployERCXToken() {
        return new Promise(function(succ, fail) {
            deployer.deploy(ERCXToken, 1000000, "ERCX", "ERCX").then(function() {
                contractInfo["ERCXTokenAddress"] = ERCXToken.address;
                succ();
            })
        });
    }

    function deployWETHToken() {
        return new Promise(function(succ, fail) {
            deployer.deploy(ERCXToken, 10000, "DWETH", "DWETH").then(function() {
                contractInfo["WETHTokenAddress"] = ERCXToken.address;
                succ();
            })
        });
    }

    function getEtherBalance(address) {
        return new Promise(function(succ, fail) {
            web3.eth.getBalance(address, function(err, balance) {
                if (err) {
                    console.log("Failed to get token balance for " + address);
                    fail();
                    return;
                }
                succ(web3.fromWei(balance));
            });
        });
    }

    function transferEther(to, minAmount) {
        return new Promise(function(succ, fail) {
            getEtherBalance(to).then((ethBal) => {
                log("Eth Balance of - " + to + " - " + ethBal);
                if (ethBal < minAmount) {
                    var transferAmount = minAmount - ethBal;
                    log("Transfering " + transferAmount + " Ether to " + to);
                    web3.eth.sendTransaction({
                        from: tokenCreatorAddress,
                        to: to,
                        value: web3.toWei(transferAmount)
                    }, function(err) {
                        if (err) {
                            console.log("Failed to transfer ether to " + to);
                            fail();
                            return;
                        }
                        console.log("Transfered ether to " + to);
                        succ();
                    });
                }
            })
        });
    }

    function getTokenBalance(abi, tokenAddress, address) {
        return new Promise(function(succ, fail) {
            var tokenContract = web3.eth.contract(abi);
            var token = tokenContract.at(tokenAddress);
            let tokenBal = token.balanceOf(address, function(err, balance) {
                if (err) {
                    console.log("Failed to get token balance for " + address);
                    fail();
                    return;
                }
                succ(balance);
            });
        });
    }

    function transferToken(abi, tokenAddress, to, minAmount) {
        return new Promise(function(succ, fail) {
            getTokenBalance(abi, tokenAddress, to).then((tokenBal) => {
                log("Token Balance of - " + to + " - " + tokenBal);
                if (tokenBal < minAmount) {
                    var tokenContract = web3.eth.contract(abi);
                    var token = tokenContract.at(tokenAddress);
                    var transferAmount = minAmount - tokenBal;
                    log("Transfering " + transferAmount + " tokens to " + to);
                    token.transfer(to, transferAmount, {
                        from: tokenCreatorAddress
                    }, function(err, res) {
                        if (err) {
                            console.log("Failed to transfer token to " + to);
                            fail();
                            return;
                        }
                        succ();
                    });
                    succ();
                }
            })
        });
    }

    function setupInitialEtherAndTokens() {
        return new Promise(function(succ, fail) {
            Promise.all([
                transferEther(bankerAddress, initialEther),
                transferEther(playerAddress, initialEther),
                transferToken(contractInfo.ERCXTokenABI, contractInfo.WETHTokenAddress, bankerAddress, initialTokens),
                transferToken(contractInfo.ERCXTokenABI, contractInfo.ERCXTokenAddress, playerAddress, (initialTokens * 200))
            ]).then(() => {
                succ();
            });
        });
    }

    function saveAbiAndAddressForWebapp() {
        return new Promise(function(succ, fail) {
            var contractInfoFilePath = "./example/src/eth/abi.js";
            var fileData = "/*\n Auto generated by migrations script 2_deploy_contracts.js \n*/\n\
export default " + JSON.stringify(contractInfo, null, 4) + "\n";
            fs.writeFile(contractInfoFilePath, fileData, function(err) {
                if (err) {
                    console.log(err);
                    fail();
                    return;
                }
                log("Contract ABI & Address Saved - " + contractInfoFilePath);
                succ();
            });
        });
    }

    function setTokenCreatorAddress() {
        return new Promise(function(succ, fail) {
            web3.eth.getAccounts((err, res) => {
                if (err) {
                    console.log(err);
                    fail();
                    return;
                }
                tokenCreatorAddress = res[0];
                succ();
            })
        });
    }

    function log(message) {
        console.log(">>>> " + message);
    }

    Promise.all([deployBadla(), deployERCXToken(), deployWETHToken()]).then(function() {
        setTokenCreatorAddress().then(() => {
            Promise.all([saveAbiAndAddressForWebapp(), setupInitialEtherAndTokens()]).then(function() {
                console.log("DONE");
            });
        });
    });
};