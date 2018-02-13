pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
import "./ERC20Interface.sol";
import "./WalletLib.sol";
import "./ProposalsLib.sol";
import "./oraclizeAPI_0.5.sol"; // solhint-disable-line


contract Badla is usingOraclize {

    using WalletLib for WalletLib.Wallet;
    using ProposalsLib for ProposalsLib.Proposal;

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

            return (p.users.banker, p.users.player, p.tokens.cashTokenAddress, p.terms.vol,
            p.tokens.tokenAddress, p.terms.nearLegPrice,
            p.terms.term, p.terms.farLegPrice, p.triggerInfo.triggerPrice,
            p.triggerInfo.priceURL,
            p.isReverseRepo, p.status, p.startTime);
    }

    function createProposal(string uuid,
                            address cashTokenAddress,
                            uint vol,
                            address tokenAddress,
                            uint nearLegPrice,
                            uint term,
                            uint farLegPrice,
                            uint triggerPrice,
                            string priceURL,
                            bool isReverseRepo) public returns (bool) {

        require(nearLegPrice > farLegPrice);
        require(!proposals[uuid].exists);

        if (!(ERC20Interface(cashTokenAddress).allowance(msg.sender, this) >= vol &&
            ERC20Interface(cashTokenAddress).transferFrom(msg.sender, this, vol))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to create prosposal");
            return false;
        }

        ProposalsLib.Proposal storage proposal = proposals[uuid];
        proposal.init(uuid, cashTokenAddress, vol, tokenAddress, nearLegPrice, term,
            farLegPrice, triggerPrice, priceURL, isReverseRepo);

        return true;
    }

    function acceptProposal(string pid) public returns (bool) {

        require(proposals[pid].exists);

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canAccept());

        uint tokenAmount = p.terms.nearLegPrice * p.terms.vol;

        if (!(ERC20Interface(p.tokens.tokenAddress).allowance(msg.sender, this) >= tokenAmount &&
            ERC20Interface(p.tokens.tokenAddress).transferFrom(msg.sender, this, tokenAmount))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to accept prosposal");
            return false;
        }

        wallet.sendTo(msg.sender, p.tokens.cashTokenAddress, p.terms.vol);
        p.markAccepted(msg.sender);

        return true;
    }

    function settleProposal(string pid) public returns(bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canSettle());

        if (!(ERC20Interface(p.tokens.cashTokenAddress).allowance(msg.sender, this) >= p.terms.vol &&
            ERC20Interface(p.tokens.cashTokenAddress).transferFrom(msg.sender, this, p.terms.vol))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to settle prosposal");
            return false;
        }

        uint playerAmount = (p.terms.farLegPrice * p.terms.vol);
        uint bankerAmount = ((p.terms.nearLegPrice-p.terms.farLegPrice) * p.terms.vol);

        wallet.sendTo(p.users.player, p.tokens.tokenAddress, playerAmount);
        wallet.sendTo(p.users.banker, p.tokens.cashTokenAddress, p.terms.vol);
        wallet.sendTo(p.users.banker, p.tokens.tokenAddress, bankerAmount);

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

        wallet.sendTo(p.users.banker, p.tokens.tokenAddress, (p.terms.nearLegPrice * p.terms.vol));

        p.markForceClosedOnExpiry();

        return true;
    }

    function cancelProposal(string pid) public returns (bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canCancel());

        wallet.sendTo(p.users.banker, p.tokens.cashTokenAddress, p.terms.vol);
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

        wallet.sendTo(p.users.banker, p.tokens.tokenAddress, (p.terms.nearLegPrice * p.terms.vol));
        p.markForceClosedOnPrice();

        return true;
    }
}
