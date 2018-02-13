pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
import "./ERC20Interface.sol";


library ProposalsLib {

    enum Status {
        NEW,
        ACCEPTED,
        CANCELLED,
        FORCE_CLOSING,
        FORCE_CLOSED_EXPIRY,
        FORCE_CLOSED_PRICE,
        SETTLED
    }

    event LogStatusEvent(uint8 indexed status, uint proposalId);

    struct Terms {
        uint vol;
        uint nearLegPrice;
        uint term; //In days
        uint farLegPrice;
    }

    struct TriggerInfo {
        string priceURL;
        uint triggerPrice;
    }

    struct Users {
        address banker;
        address player;
    }

    struct Tokens {
        address cashTokenAddress;
        address tokenAddress;
    }

    struct Proposal {
        uint proposalId;
        bool exists;
        Users users;
        Terms terms;
        TriggerInfo triggerInfo;
        uint8 status;
        Tokens tokens;
        bool isReverseRepo;
        uint startTime; //in epoch
    }

    function init(Proposal storage self,
            uint proposalId,
            address cashTokenAddress,
            uint vol,
            address tokenAddress,
            uint nearLegPrice,
            uint term,
            uint farLegPrice,
            uint triggerPrice,
            string priceURL,
            bool isReverseRepo) public {

        self.proposalId = proposalId;
        self.exists = true;
        self.tokens = Tokens(cashTokenAddress, tokenAddress);
        self.users = Users(msg.sender, address(0));
        self.terms = Terms(vol, nearLegPrice, term, farLegPrice);
        self.triggerInfo = TriggerInfo(priceURL, triggerPrice);
        self.status = uint8(Status.NEW);
        self.isReverseRepo = isReverseRepo;

        LogStatusEvent(self.status, self.proposalId);
    }

    function canCancel(Proposal self) internal view returns (bool) {
        return self.exists && self.status == uint8(Status.NEW) &&
        self.users.banker == msg.sender;
    }

    function canAccept(Proposal self) internal view returns (bool) {
        return self.exists && self.status == uint8(Status.NEW) &&
        self.users.banker == msg.sender;
    }

    function canSettle(Proposal self) internal view returns (bool) {
        return self.exists && self.status == uint8(Status.ACCEPTED) &&
        self.users.player == msg.sender;
    }

    function canForceClose(Proposal self) internal view returns (bool) {
        return self.exists && self.status == uint8(Status.ACCEPTED) &&
        self.users.banker == msg.sender;
    }

    function isExpired(Proposal self) internal view returns (bool) {
        return block.timestamp > (self.startTime + self.terms.term);
    }

    function markAccepted(Proposal storage self, address player) internal {
        self.users.player = player;
        self.startTime = block.timestamp;
        self.status = uint8(Status.ACCEPTED);
        LogStatusEvent(self.status, self.proposalId);
    }

    function resetAccepted(Proposal storage self) internal {
        self.status = uint8(Status.ACCEPTED);
        LogStatusEvent(self.status, self.proposalId);
    }

    function markCancelled(Proposal storage self) internal {
        self.status = uint8(Status.CANCELLED);
        LogStatusEvent(self.status, self.proposalId);
    }

    function markSettled(Proposal storage self) internal {
        self.status = uint8(Status.SETTLED);
        LogStatusEvent(self.status, self.proposalId);
    }

    function markForceClosing(Proposal storage self) internal {
        self.status = uint8(Status.FORCE_CLOSING);
        LogStatusEvent(self.status, self.proposalId);
    }

    function markForceClosedOnPrice(Proposal storage self) internal {
        self.status = uint8(Status.FORCE_CLOSED_PRICE);
        LogStatusEvent(self.status, self.proposalId);
    }

    function markForceClosedOnExpiry(Proposal storage self) internal {
        self.status = uint8(Status.FORCE_CLOSED_EXPIRY);
        LogStatusEvent(self.status, self.proposalId);
    }

}
