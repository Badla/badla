pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
//import "./oraclizeAPI_0.5.sol"; // solhint-disable-line


contract ERC20Interface {

    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);
}


//contract Badla is usingOraclize {
contract Badla {

    uint public currentPrice;

    enum Status {
        NEW,
        ACCEPTED,
        CANCELLED,
        FORCE_CLOSED_EXPIRY,
        FORCE_CLOSED_PRICE,
        SETTLED
    }

    enum Errors {
        INSUFFICIENT_BALANCE_OR_ALLOWANCE,
        UNAUTHORIZED_ACCESS,
        PROPOSAL_INVALID_STATUS,
        INVALID_PROPOSAL,
        WALLET_ERROR
    }

    //Two tokens are ETHX and BWETH
    struct Proposal {

        bool exists;
        address banker;
        address player;
        uint vol;
        uint nearLegPrice;
        uint term;
        uint farLegPrice;
        uint triggerPrice;
        uint8 status;
        address cashTokenAddress;
        address tokenAddress;

        //0 -> new, 1-> accepted, 2->cancelled, 3->force on expiry, 4-> force on price, 5->settled

        uint startTime;
    }

    mapping(string => Proposal) proposals;
    mapping(address => mapping(address => uint)) public wallet;

    uint public proposalCount;

    event LogProsposalEvent(uint8 indexed status, string proposalId);
    event LogError(uint8 indexed errorId, string description);
    event LogWithdrawEvent(address indexed account, address indexed token, uint amount);

    function getProposal(string pid) public constant returns (Proposal) {
        return proposals[pid];
    }

    function createProposal(string pid,
                            address cashTokenAddress,
                            uint vol,
                            address tokenAddress,
                            uint nearLegPrice,
                            uint term,
                            uint farLegPrice,
                            uint triggerPrice) public returns (bool) {


        require(nearLegPrice > farLegPrice);
        require(!doesProsposalExist(pid));

        if (!(ERC20Interface(cashTokenAddress).allowance(msg.sender, this) >= vol &&
            ERC20Interface(cashTokenAddress).transferFrom(msg.sender, this, vol))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to create prosposal");
            return false;
        }

        Proposal storage p = proposals[pid];
        p.cashTokenAddress = cashTokenAddress;
        p.tokenAddress = tokenAddress;
        p.exists = true;
        p.banker = msg.sender;
        p.vol = vol;
        p.term = term * 3600;
        p.nearLegPrice = nearLegPrice;
        p.farLegPrice = farLegPrice;
        p.triggerPrice = triggerPrice;
        p.status = uint8(Status.NEW);

        LogProsposalEvent(uint8(Status.NEW), pid);

        return true;
    }

    function acceptProposal(string pid) public returns (bool) {

        Proposal memory p = proposals[pid];
        require(p.exists);
        require(p.status == 0);
        require(p.banker != msg.sender);

        uint tokenAmount = p.nearLegPrice * p.vol;

        if (!(ERC20Interface(p.tokenAddress).allowance(msg.sender, this) >= tokenAmount &&
            ERC20Interface(p.tokenAddress).transferFrom(msg.sender, this, tokenAmount))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to accept prosposal");
            return false;
        }

        wallet[msg.sender][p.cashTokenAddress] += p.vol;

        p.player = msg.sender;
        p.startTime = block.timestamp;
        p.status = uint8(Status.ACCEPTED);

        LogProsposalEvent(uint8(Status.ACCEPTED), pid);

        return true;
    }

    function settleProposal(string pid) public returns(bool) {

        Proposal storage p = proposals[pid];
        require(p.exists);
        require(p.status == 1);
        require(p.player == msg.sender);

        if (!(ERC20Interface(p.cashTokenAddress).allowance(msg.sender, this) >= p.vol &&
            ERC20Interface(p.cashTokenAddress).transferFrom(msg.sender, this, p.vol))) {
            LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), "Insufficient balance to settle prosposal");
            return false;
        }

        wallet[p.player][p.tokenAddress] += (p.farLegPrice * p.vol);
        wallet[p.banker][p.cashTokenAddress] += p.vol;
        wallet[p.banker][p.cashTokenAddress] += ((p.nearLegPrice-p.farLegPrice) * p.vol);

        p.status = uint8(Status.SETTLED);

        LogProsposalEvent(uint8(Status.CANCELLED), pid);

        return true;
    }

    function forceCloseOnPrice(string pid) public returns(bool) {

        Proposal storage p = proposals[pid];
        require(p.exists);
        require(p.status == 1);
        require(currentPrice > p.triggerPrice);
        require(p.banker == msg.sender);

        wallet[p.banker][p.tokenAddress] += (p.nearLegPrice * p.vol);

        p.status = uint8(Status.FORCE_CLOSED_PRICE);

        LogProsposalEvent(uint8(Status.FORCE_CLOSED_PRICE), pid);

        return true;
    }

    function forceCloseOnExpiry(string pid) public returns(bool) {

        Proposal storage p = proposals[pid];
        require(p.exists);
        require(p.status == 1);
        require(block.timestamp > (p.startTime + p.term));
        require(p.banker == msg.sender);

        wallet[p.banker][p.tokenAddress] += (p.nearLegPrice * p.vol);

        p.status = uint8(Status.FORCE_CLOSED_EXPIRY);

        LogProsposalEvent(uint8(Status.FORCE_CLOSED_EXPIRY), pid);

        return true;
    }

    function cancelProposal(string pid) public returns (bool) {

        Proposal storage p = proposals[pid];
        require(p.exists);
        require(p.status == 0);
        require(p.banker == msg.sender);

        wallet[p.banker][p.cashTokenAddress] += p.vol;

        p.status = uint8(Status.CANCELLED);

        LogProsposalEvent(uint8(Status.CANCELLED), pid);

        return true;
    }

    function withdraw(address tokenAddress) public returns (bool) {

        uint amount = wallet[msg.sender][tokenAddress];

        if (amount > 0) {

            wallet[msg.sender][tokenAddress] = 0;

            if (!ERC20Interface(tokenAddress).transferFrom(this, msg.sender, amount)) {
                wallet[msg.sender][tokenAddress] = amount;
                LogError(uint8(Errors.WALLET_ERROR), "Unable to withdraw from wallet");
                return false;
            }

        }

        LogWithdrawEvent(msg.sender, tokenAddress, amount);

        return true;
    }

    /*function __callback(bytes32, string result) public {

        if (msg.sender != oraclize_cbAddress()) revert();

        currentPrice = stringToUint(result);

        updatePrice();
    }

    function updatePrice() public payable {

        if (oraclize_getPrice("URL") > this.balance) {
            LogBadlaEvent("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            LogBadlaEvent("Oraclize query was sent, standing by for the answer..");
            oraclize_query(60, "URL", "json(http://demo5882368.mockable.io/latest_price).rates.ERCX");
        }
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
    }*/
    function doesProsposalExist(string pid) internal view returns (bool exists) {
        Proposal memory p = proposals[pid];
        return p.exists;
    }
}
