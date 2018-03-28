pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
import "./libs/StringsLib.sol";
import "./libs/WalletLib.sol";
import "./libs/ProposalsLib.sol";
import "./libs/TokenTransferLib.sol";
import "./libs/oraclizeAPI_0.5.sol";


contract Badla is usingOraclize {

    using StringsLib for string;
    using WalletLib for WalletLib.Wallet;
    using ProposalsLib for ProposalsLib.Proposal;
    using TokenTransferLib for address;

    enum Errors {
        INSUFFICIENT_BALANCE_OR_ALLOWANCE,
        TRIGGER_PRICE
    }

    event LogError(uint8 indexed errorId, string description);

    WalletLib.Wallet internal wallet;
    mapping(string => ProposalsLib.Proposal) internal proposals;
    mapping(bytes32 => string) public priceQueries;

    /**
    @dev Get details of a proposal
    @param proposalId is the UUID of the proposal.
    @return Banker Address, Player Address, Token 1 Address, Token 1 Volume, Token 2 Address,
            Near Leg Price, Term (in seconds), Far Leg Price, Trigger Price, Price URL,
            reverseRepo (true for Reverse Repo, false for Repo), Status of Proposal,
            Proposal Start Time(or accept time)
    */
    function getProposal(string proposalId) public constant
        returns(address, address, address, uint, address, uint, uint, uint, uint, string, bool, uint, uint) {

            require(proposals[proposalId].exists);

            ProposalsLib.Proposal memory p = proposals[proposalId];

            return (p.users.banker, p.users.player, p.tokens.token1Address, p.terms.vol,
            p.tokens.token2Address, p.terms.nearLegPrice,
            p.terms.term, p.terms.farLegPrice, p.triggerInfo.triggerPrice,
            p.triggerInfo.priceURL,
            p.triggerInfo.reverseRepo, p.status, p.startTime);
        }

    /**
    @notice Banker needs to allocate "vol" of Token 1 to Badla contract
    @dev Create a New Proposal(As a Banker)
    @param uuid is the UUID of the proposal.
    @param token1Address Address of Token 1.
    @param vol Token 1 Volume
    @param token2Address Address of Token 2
    @param nearLegPrice Near Leg Price
    @param term Proposal Term (in seconds)
    @param farLegPrice Far Leg Price
    @param triggerPrice Trigger Price to enable for forced close.
    @param priceURL Source URL for Token 1 -> Token 2 exchange Price
    @param reverseRepo (true for Reverse Repo, false for Repo)
    */
    function createProposal(string uuid,
                            address token1Address,
                            uint vol,
                            address token2Address,
                            uint nearLegPrice,
                            uint term,
                            uint farLegPrice,
                            uint triggerPrice,
                            string priceURL,
                            bool reverseRepo) public returns (bool) {

        require(!proposals[uuid].exists);

        oraclize_setNetwork(networkID_testnet);

        if (reverseRepo) {
            //token1Address - WETH, token2Address - ERCX
            if (!(msg.sender.safeTransfer(this, token1Address, vol))) {
                LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to create prosposal");
                return false;
            }
        }  else {
            //token1Address - ERCX, token2Address - DWETH
            if (!(msg.sender.safeTransfer(this, token1Address, vol * nearLegPrice))) {
                LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to create prosposal");
                return false;
            }
        }

        ProposalsLib.Proposal storage proposal = proposals[uuid];
        proposal.init(uuid, token1Address, vol, token2Address, nearLegPrice, term,
            farLegPrice, triggerPrice, priceURL, reverseRepo);

        return true;
    }

    /**
    @notice Player needs to allocate "Near Leg Price * vol" of Token 2 to Badla contract
    @dev Accept the prosposal(As a Player)
    @param pid is the pid of the proposal.
    */
    function acceptProposal(string pid) public returns (bool) {

        require(proposals[pid].exists);

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canAccept());

        uint tokenAmount = 0;

        if (p.triggerInfo.reverseRepo) {

            tokenAmount = p.terms.nearLegPrice * p.terms.vol;

            if (!(msg.sender.safeTransfer(this, p.tokens.token2Address, tokenAmount))) {
                LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to accept prosposal");
                return false;
            }

            wallet.sendTo(msg.sender, p.tokens.token1Address, p.terms.vol);
        } else {

            tokenAmount = p.terms.vol;

            if (!(msg.sender.safeTransfer(this, p.tokens.token2Address, tokenAmount))) {
                LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to accept prosposal");
                return false;
            }

            wallet.sendTo(msg.sender, p.tokens.token1Address, p.terms.nearLegPrice * p.terms.vol);
        }

        p.markAccepted(msg.sender);

        return true;
    }

    /**
    @notice Player needs to allocate "vol" of Token 1 to Badla contract
    @dev Settle the prosposal(As a Player)
    @param pid is the pid of the proposal.
    On settlement, banker gets "vol" token 1 and token 2 commission.
    Player gets back all her Token 2.
    */
    function settleProposal(string pid) public returns(bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canSettle());

        uint playerAmount = 0;
        uint bankerAmount = 0;
        if (p.triggerInfo.reverseRepo) {

            if (!(msg.sender.safeTransfer(this, p.tokens.token1Address, p.terms.vol))) {
                LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to settle prosposal");
                return false;
            }

            playerAmount = (p.terms.farLegPrice * p.terms.vol);
            bankerAmount = ((p.terms.nearLegPrice-p.terms.farLegPrice) * p.terms.vol);

            wallet.sendTo(p.users.player, p.tokens.token2Address, playerAmount);
            wallet.sendTo(p.users.banker, p.tokens.token1Address, p.terms.vol);
            wallet.sendTo(p.users.banker, p.tokens.token2Address, bankerAmount);

            p.markSettled();

        } else {

            if (!(msg.sender.safeTransfer(this, p.tokens.token1Address, p.terms.farLegPrice * p.terms.vol))) {
                LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to settle prosposal");
                return false;
            }

            playerAmount = p.terms.vol;
            bankerAmount = (p.terms.farLegPrice * p.terms.vol);

            wallet.sendTo(p.users.player, p.tokens.token2Address, playerAmount);
            wallet.sendTo(p.users.banker, p.tokens.token1Address, bankerAmount);

            p.markSettled();
        }

        return true;
    }

    /**
    @dev Force close the prosposal(As a Banker) based on trigger price.
    @param pid is the pid of the proposal.
    Banker has to pay to Oraclize Service
    */
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

    function __callback(bytes32 queryId, string result, bytes proof) public {

        if (msg.sender != oraclize_cbAddress()) revert();
        LogError(uint8(Errors.TRIGGER_PRICE), "__callback was called");

        LogError(uint8(Errors.TRIGGER_PRICE), result);

        uint currentPrice = result.toUint();
        string memory proposalId = priceQueries[queryId];

        ProposalsLib.Proposal storage p = proposals[proposalId];

        require(p.exists);

        if ((p.triggerInfo.reverseRepo && currentPrice > p.triggerInfo.triggerPrice) ||
            (!p.triggerInfo.reverseRepo && currentPrice < p.triggerInfo.triggerPrice)) {

            _forceCloseOnPrice(proposalId);
            LogError(uint8(Errors.TRIGGER_PRICE),
                    "Trigger breached. Settlement request approved");
        } else {

            LogError(uint8(Errors.TRIGGER_PRICE),
                    "Trigger not breached. Settlement request rejected");
            p.resetAccepted();
        }
    }

    /**
    @dev Force close the prosposal(As a Banker) based on expiry.
    @param pid is the pid of the proposal.
    */
    function forceCloseOnExpiry(string pid) public returns(bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canForceClose());
        require(p.isExpired());

        if (p.triggerInfo.reverseRepo) {
            wallet.sendTo(p.users.banker, p.tokens.token2Address, (p.terms.nearLegPrice * p.terms.vol));
        } else {
            wallet.sendTo(p.users.banker, p.tokens.token2Address, (p.terms.vol));
        }

        p.markForceClosedOnExpiry();

        return true;
    }

    /**
    @dev Cancel the prosposal(As a Banker).
    @param pid is the pid of the proposal.
    You can only cancel the proposal if it is not accepted by the player
    */
    function cancelProposal(string pid) public returns (bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canCancel());

        if (p.triggerInfo.reverseRepo) {
            wallet.sendTo(p.users.banker, p.tokens.token1Address, p.terms.vol);
        } else {
            wallet.sendTo(p.users.banker, p.tokens.token1Address, p.terms.nearLegPrice * p.terms.vol);
        }
        p.markCancelled();

        return true;
    }

    /**
    @dev Withdraw token from Badla wallet.
    @param tokenAddress is the Address of Token.
    */
    function withdraw(address tokenAddress) public returns (bool) {
        return wallet.withdraw(tokenAddress);
    }

    /**
    @dev Get Users Token Balance in Badla Wallet
    @param tokenAddress is the Address of Token.
    */
    function balanceOf(address tokenAddress) public view returns (uint) {
        return wallet.balanceOf(msg.sender, tokenAddress);
    }

    function _forceCloseOnPrice(string pid) private returns(bool) {

        ProposalsLib.Proposal storage p = proposals[pid];
        require(p.canForceClose());

        if (p.triggerInfo.reverseRepo) {
            wallet.sendTo(p.users.banker, p.tokens.token2Address, (p.terms.nearLegPrice * p.terms.vol));
        } else {
            wallet.sendTo(p.users.banker, p.tokens.token2Address, (p.terms.vol));
        }
        p.markForceClosedOnPrice();

        return true;
    }
}
