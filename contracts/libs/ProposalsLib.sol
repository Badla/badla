pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed


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

    event LogStatusEvent(string indexed proposalId, uint8 indexed status);

    struct Terms {
        uint vol;
        uint nearLegPrice;
        uint term; //In days
        uint farLegPrice;
    }

    struct TriggerInfo {
        string priceURL;
        uint triggerPrice;
        bool triggerAbove;
    }

    struct Users {
        address banker;
        address player;
    }

    struct Tokens {
        address token1Address;
        address token2Address;
    }

    struct Proposal {
        string proposalId;
        bool exists;
        Users users;
        Terms terms;
        TriggerInfo triggerInfo;
        uint8 status;
        Tokens tokens;
        uint startTime; //in epoch
    }

    function init(Proposal storage self,
            string proposalId,
            address token1Address,
            uint vol,
            address token2Address,
            uint nearLegPrice,
            uint term,
            uint farLegPrice,
            uint triggerPrice,
            string priceURL,
            bool triggerAbove) public {

        self.proposalId = proposalId;
        self.exists = true;
        self.tokens = Tokens(token1Address, token2Address);
        self.users = Users(msg.sender, address(0));
        self.terms = Terms(vol, nearLegPrice, term, farLegPrice);
        self.triggerInfo = TriggerInfo(priceURL, triggerPrice, triggerAbove);
        self.status = uint8(Status.NEW);

        LogStatusEvent(self.proposalId, self.status);
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
        LogStatusEvent(self.proposalId, self.status);
    }

    function resetAccepted(Proposal storage self) internal {
        self.status = uint8(Status.ACCEPTED);
        LogStatusEvent(self.proposalId, self.status);
    }

    function markCancelled(Proposal storage self) internal {
        self.status = uint8(Status.CANCELLED);
        LogStatusEvent(self.proposalId, self.status);
    }

    function markSettled(Proposal storage self) internal {
        self.status = uint8(Status.SETTLED);
        LogStatusEvent(self.proposalId, self.status);
    }

    function markForceClosing(Proposal storage self) internal {
        self.status = uint8(Status.FORCE_CLOSING);
        LogStatusEvent(self.proposalId, self.status);
    }

    function markForceClosedOnPrice(Proposal storage self) internal {
        self.status = uint8(Status.FORCE_CLOSED_PRICE);
        LogStatusEvent(self.proposalId, self.status);
    }

    function markForceClosedOnExpiry(Proposal storage self) internal {
        self.status = uint8(Status.FORCE_CLOSED_EXPIRY);
        LogStatusEvent(self.proposalId, self.status);
    }

}
