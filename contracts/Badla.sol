pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
import "./WalletLib.sol";
import "./ProposalsLib.sol";
import "./TokenTransferLib.sol";
import "./oraclizeAPI_0.5.sol"; // solhint-disable-line


contract Badla is usingOraclize {

    using WalletLib for WalletLib.Wallet;
    using ProposalsLib for ProposalsLib.Proposal;
    using TokenTransferLib for address;

    enum Errors {
        INSUFFICIENT_BALANCE_OR_ALLOWANCE,
        UNAUTHORIZED_ACCESS,
        PROPOSAL_INVALID_STATUS,
        TRIGGER_PRICE,
        WALLET_ERROR
    }

    event LogStatusEvent(uint8 indexed status, uint proposalId);
    event LogError(uint8 indexed errorId, string description);

    WalletLib.Wallet internal wallet;
    mapping(string => ProposalsLib.Proposal) internal proposals;
    mapping(bytes32 => string) public priceQueries;

    function getProposal(string proposalId) public constant
        returns(address, address, address, uint, address, uint, uint, uint, uint, string, bool, uint, uint) {

            require(proposals[proposalId].exists);

            ProposalsLib.Proposal memory p = proposals[proposalId];

            return (p.users.banker, p.users.player, p.tokens.token1Address, p.terms.vol,
            p.tokens.token2Address, p.terms.nearLegPrice,
            p.terms.term, p.terms.farLegPrice, p.triggerInfo.triggerPrice,
            p.triggerInfo.priceURL,
            p.triggerAbove, p.status, p.startTime);
    }

    function createProposal(string uuid,
                            address token1Address,
                            uint vol,
                            address token2Address,
                            uint nearLegPrice,
                            uint term,
                            uint farLegPrice,
                            uint triggerPrice,
                            string priceURL,
                            bool triggerAbove) public returns (bool) {

        require(nearLegPrice > farLegPrice);
        require(!proposals[uuid].exists);

        if (!(msg.sender.safeTransfer(this, token1Address, vol))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to create prosposal");
            return false;
        }

        ProposalsLib.Proposal storage proposal = proposals[uuid];
        proposal.init(uuid, token1Address, vol, token2Address, nearLegPrice, term,
            farLegPrice, triggerPrice, priceURL, triggerAbove);

        return true;
    }

    function acceptProposal(string pid) public returns (bool) {

        require(proposals[pid].exists);

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canAccept());

        uint tokenAmount = p.terms.nearLegPrice * p.terms.vol;

        if (!(msg.sender.safeTransfer(this, p.tokens.token2Address, tokenAmount))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to accept prosposal");
            return false;
        }

        wallet.sendTo(msg.sender, p.tokens.token1Address, p.terms.vol);
        p.markAccepted(msg.sender);

        return true;
    }

    function settleProposal(string pid) public returns(bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canSettle());

        if (!(msg.sender.safeTransfer(this, p.tokens.token1Address, p.terms.vol))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to settle prosposal");
            return false;
        }

        uint playerAmount = (p.terms.farLegPrice * p.terms.vol);
        uint bankerAmount = ((p.terms.nearLegPrice-p.terms.farLegPrice) * p.terms.vol);

        wallet.sendTo(p.users.player, p.tokens.token2Address, playerAmount);
        wallet.sendTo(p.users.banker, p.tokens.token1Address, p.terms.vol);
        wallet.sendTo(p.users.banker, p.tokens.token2Address, bankerAmount);

        p.markSettled();

        return true;
    }

    function forceCloseOnPrice(string pid) public payable returns(bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canForceClose());

        if (oraclize_getPrice("URL") > this.balance) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE),
                    "Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {

            p.markForceClosing();

            //json(http://demo5882368.mockable.io/latest_price).rates.ERCX
            bytes32 queryId = oraclize_query("URL", p.triggerInfo.priceURL);
            priceQueries[queryId] = pid;
        }
    }

    function __callback(bytes32 queryId, string result) public {

        if (msg.sender != oraclize_cbAddress()) revert();

        uint currentPrice = stringToUint(result);
        string memory proposalId = priceQueries[queryId];

        ProposalsLib.Proposal storage p = proposals[proposalId];

        require(p.exists);

        if (currentPrice > p.triggerInfo.triggerPrice) {
            _forceCloseOnPrice(proposalId);
        } else {

            LogError(uint8(Errors.TRIGGER_PRICE),
                    "current price is below trigger price");
            p.resetAccepted();
        }
    }

    function forceCloseOnExpiry(string pid) public returns(bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canForceClose());
        require(p.isExpired());

        wallet.sendTo(p.users.banker, p.tokens.token2Address, (p.terms.nearLegPrice * p.terms.vol));

        p.markForceClosedOnExpiry();

        return true;
    }

    function cancelProposal(string pid) public returns (bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canCancel());

        wallet.sendTo(p.users.banker, p.tokens.token1Address, p.terms.vol);
        p.markCancelled();

        return true;
    }

    function withdraw(address tokenAddress) public returns (bool) {
        return wallet.withdraw(tokenAddress);
    }

    function balanceOf(address tokenAddress) public view returns (uint) {
        return wallet.balanceOf(msg.sender, tokenAddress);
    }

    function stringToUint(string s) internal pure returns (uint result) {

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

    function _forceCloseOnPrice(string pid) private returns(bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canForceClose());

        wallet.sendTo(p.users.banker, p.tokens.token2Address, (p.terms.nearLegPrice * p.terms.vol));
        p.markForceClosedOnPrice();

        return true;
    }
}
