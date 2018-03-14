pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed


library StringsLib {

    function toUint(string s) internal pure returns (uint result) {

        bytes memory b = bytes(s);
        uint i;
        result = 0;
        for (i = 0; i < b.length; i++) {
            uint c = uint(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
    }

}
