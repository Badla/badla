pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
import "./ERC20Interface.sol";


library WalletLib {

    struct Wallet {
        mapping(address => mapping(address => uint)) balances;
    }

    event LogSendTo(address indexed owner, address indexed token, uint value);
    event LogWithdraw(address indexed owner, address indexed token, uint value);
    event LogError(address indexed owner, address indexed token, string message);

    function balanceOf(Wallet storage self, address owner, address token) public constant returns (uint balance) {
        return self.balances[owner][token];
    }

    function withdraw(Wallet storage self, address token) public returns (bool) {

        uint amount = self.balances[msg.sender][token];

        if (amount > 0) {

            self.balances[msg.sender][token] = 0;

            if (!ERC20Interface(token).transferFrom(this, msg.sender, amount)) {
                self.balances[msg.sender][token] = amount;
                LogError(msg.sender, token, "Unable to withdraw from wallet");
                return false;
            }

        }

        LogWithdraw(msg.sender, token, amount);

        return true;
    }

    function sendTo(Wallet storage self, address owner, address token, uint amount) internal {

        LogSendTo(owner, token, amount);
        self.balances[owner][token] += amount;
    }

}
