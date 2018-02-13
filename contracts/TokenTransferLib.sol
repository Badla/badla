pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
import "./ERC20Interface.sol";


library TokenTransferLib {

    function safeTransfer(address from, address to, address token, uint amount) internal returns(bool) {

        if (!(ERC20Interface(token).allowance(from, to) >= amount &&
            ERC20Interface(token).transferFrom(from, to, amount))) {
            return false;
        }

        return true;
    }
}
