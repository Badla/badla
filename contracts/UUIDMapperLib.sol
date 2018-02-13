pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed


library UUIDMapperLib {

    struct UUIDMapper {
        mapping(string => uint) mappings;
    }

    function isUUIDUnique(UUIDMapper storage self, string uuid) public view returns (bool exists) {
        return self.mappings[uuid] != 0;
    }

    function addIdentifier(UUIDMapper storage self, string uuid, uint identifier) public {
        self.mappings[uuid] = identifier;
    }

    function getIdentifier(UUIDMapper storage self, string uuid) public view returns (uint identifier) {
        return self.mappings[uuid];
    }
}
