var Badla = artifacts.require("./Badla.sol");
var ERCXToken = artifacts.require("./ERCXToken.sol");

module.exports = function(deployer) {
  deployer.deploy(Badla);
  deployer.deploy(ERCXToken, 50000, "ERCX", "ERCX");
  deployer.deploy(ERCXToken, 50000, "DWETH", "DWETH");
};
