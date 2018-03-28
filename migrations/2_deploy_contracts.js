var StringsLib = artifacts.require("./libs/StringsLib.sol");
var WalletLib = artifacts.require("./libs/WalletLib.sol");
var ProposalsLib = artifacts.require("./libs/ProposalsLib.sol");
var TokenTransferLib = artifacts.require("./libs/TokenTransferLib.sol");
var Badla = artifacts.require("./Badla.sol");
var ERCXToken = artifacts.require("./ERCXToken.sol");
var fs = require('fs');

module.exports = function(deployer) {
    var contractInfo = {
        BadlaABI: Badla.abi,
        ERCXTokenABI: ERCXToken.abi
    }

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
            deployer.deploy(ERCXToken, 1000000, "DWETH", "DWETH").then(function() {
                contractInfo["WETHTokenAddress"] = ERCXToken.address;
                succ();
            })
        });
    }

    function saveAbiAndAddressForWebapp() {
        return new Promise(function(succ, fail) {
            var contractInfoFilePath = "./runner/src/eth/generated/abi.js";
            var fileData = "/*\n Auto generated by migrations script 2_deploy_contracts.js \n*/\n\
export default " + JSON.stringify(contractInfo, null, 4) + "\n";
            fs.writeFile(contractInfoFilePath, fileData, function(err) {
                if (err) {
                    console.log(err);
                    fail();
                    return;
                }
                log("Contract ABI & Address Saved for runner webapp- " + contractInfoFilePath);
                succ();
            });
        });
    }

    function saveAbiAndAddressForTruffleScripts() {
        return new Promise(function(succ, fail) {
            var contractInfoFilePath = "./truffle-scripts/generated/abi.json";
            var fileData = JSON.stringify(contractInfo, null, 4) + "\n";
            fs.writeFile(contractInfoFilePath, fileData, function(err) {
                if (err) {
                    console.log(err);
                    fail();
                    return;
                }
                log("Contract ABI & Address Saved for truffle scripts - " + contractInfoFilePath);
                succ();
            });
        });
    }

    function log(message) {
        console.log(">>>> " + message);
    }

    Promise.all([deployBadla(), deployERCXToken(), deployWETHToken()]).then(function() {
        return Promise.all([saveAbiAndAddressForWebapp(), saveAbiAndAddressForTruffleScripts()]).then(() => {
            console.log("DONE");
        });
    });
};