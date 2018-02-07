var Badla = artifacts.require("./Badla.sol");
var ERCXToken = artifacts.require("./ERCXToken.sol");
var fs = require('fs');

// var Web3 = require('web3');
// var web3 = new Web3("http://localhost:7545");

module.exports = function(deployer) {
    var contractInfo = {
        BadlaABI:Badla.abi,
        ERCXTokenABI:ERCXToken.abi
    }

    var tokenCreatorAddress = web3.eth.accounts[0];
    var bankerAddress = "0xEBEb62a3840Fbef657F18CeAeFB0aA93a7212736"; //web3.eth.accounts[1]; //Replace this with metamask account address
    var playerAddress = web3.eth.accounts[2]; //Replace this with metamask account address
    var initialTokens = 1000;
    var initialEther = 20;

    function deployBadla() {
        return new Promise(function(succ, fail) {
            deployer.deploy(Badla).then(function() {
                contractInfo["BadlaAddress"] = Badla.address;
                succ();
            })
        });
    }

    function deployERCXToken() {
        return new Promise(function(succ, fail) {
            deployer.deploy(ERCXToken, 50000, "ERCX", "ERCX").then(function() {
                contractInfo["ERCXTokenAddress"] = ERCXToken.address;
                succ();
            })
        });
    }

    function deployWETHToken() {
        return new Promise(function(succ, fail) {
            deployer.deploy(ERCXToken, 50000, "DWETH", "DWETH").then(function() {
                contractInfo["WETHTokenAddress"] = ERCXToken.address;
                succ();
            })
        });
    }

    function transferEther(to, minAmount) {
        let ethBal = web3.fromWei(web3.eth.getBalance(to));
        log("Eth Balance of - "+to+" - "+ethBal);
        if (ethBal < minAmount) {
            var transferAmount = minAmount - ethBal;
            log("Transfering "+transferAmount+" Ether to "+to);
            web3.eth.sendTransaction({from:tokenCreatorAddress,to:to,value:web3.toWei(transferAmount)});
        }
    }

    function transferToken(abi, tokenAddress, to, minAmount) {
        var tokenContract = web3.eth.contract(abi);
        var token = tokenContract.at(tokenAddress);
        let tokenBal = token.balanceOf(to);
        log("Token Balance of - "+to+" - "+tokenBal);
        if (tokenBal < minAmount) {
            var transferAmount = minAmount - tokenBal;
            log("Transfering "+transferAmount+" tokens to "+to);
            token.transfer(to, transferAmount, {from:tokenCreatorAddress});
        }
    }

    function setupInitialEtherAndTokens() {
        log("Transfering initial "+initialEther+" ethers to banker and player")
        transferEther(bankerAddress, initialEther);
        transferEther(playerAddress, initialEther);
        log("Transfering intiial "+initialTokens+" WETH tokens to banker")
        transferToken(contractInfo.ERCXTokenABI, contractInfo.WETHTokenAddress, bankerAddress, initialTokens);
        log("Transfering intiial "+initialTokens+" ERCX tokens to player")
        transferToken(contractInfo.ERCXTokenABI, contractInfo.ERCXTokenAddress, playerAddress, initialTokens);
    }

    function saveAbiAndAddressForWebapp() {
        var contractInfoFilePath = "./example/src/abi.js";
        var fileData = "export default \n\t"+JSON.stringify(contractInfo, null, 4)+"\n";
        fs.writeFile(contractInfoFilePath, fileData, function(err) {
            if(err) {
                return console.log(err);
            }
            log("Contract ABI & Address Saved - "+contractInfoFilePath);
        });
    }

    function log(message) {
        console.log(">>>> "+message);
    }

    Promise.all([deployBadla(), deployERCXToken(), deployWETHToken()]).then(function() {
        saveAbiAndAddressForWebapp();
        setupInitialEtherAndTokens();
    });
};
