pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
import "./oraclizeAPI_0.5.sol"; // solhint-disable-line


contract ERC20Interface {

    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);
}


contract Badla is usingOraclize {
//contract Badla {

    uint public currentPrice;

    //Two tokens are ETHX and BWETH
    struct Proposal {

        bool exists;
        uint proposalId;
        address banker;
        address player;
        uint vol;
        uint nearLegPrice;
        uint term;
        uint farLegPrice;
        uint triggerPrice;
        uint state;
        address cashTokenAddress;
        address tokenAddress;

        //0 -> new, 1-> accepted, 2->cancelled, 3->force on expiry, 4-> force on price, 5->settled

        uint startTime;
    }

    mapping(uint => Proposal) public proposals;
    mapping(address => mapping(address => uint)) public pendingReturns;

    uint public proposalCount;

    event LogBadlaEvent(string description);

    function createProposal(address cashTokenAddress,
                            uint vol,
                            address tokenAddress,
                            uint nearLegPrice,
                            uint term,
                            uint farLegPrice,
                            uint triggerPrice) public returns (uint proposalId) {


        require(nearLegPrice > farLegPrice);
        require(ERC20Interface(cashTokenAddress).allowance(msg.sender, this) >= vol);

        if (!ERC20Interface(cashTokenAddress).transferFrom(msg.sender, this, vol)) {
            return 0;
        }

        proposalCount += 1;

        Proposal storage p = proposals[proposalCount];
        p.cashTokenAddress = cashTokenAddress;
        p.tokenAddress = tokenAddress;
        p.exists = true;
        p.proposalId = proposalCount;
        p.banker = msg.sender;
        p.vol = vol;
        p.term = term * 3600;
        p.nearLegPrice = nearLegPrice;
        p.farLegPrice = farLegPrice;
        p.triggerPrice = triggerPrice;
        p.state = 0;

        return p.proposalId;
    }

    function acceptProposal(uint proposalId) public returns (bool) {

        Proposal memory p = proposals[proposalId];
        require(p.exists);
        require(p.state == 0);
        require(ERC20Interface(p.tokenAddress).allowance(msg.sender, this) >= p.nearLegPrice * p.vol);

        if (!ERC20Interface(p.tokenAddress).transferFrom(msg.sender, this, p.nearLegPrice * p.vol)) {
            return false;
        }

        pendingReturns[msg.sender][p.cashTokenAddress] += p.vol;

        p.player = msg.sender;
        p.startTime = now;
        p.state = 1;

        return true;
    }

    function settleProposal(uint proposalId) public returns(bool) {

        Proposal storage p = proposals[proposalId];
        require(p.exists);
        require(p.state == 1);
        require(p.player == msg.sender);
        require(ERC20Interface(p.cashTokenAddress).allowance(msg.sender, this) >= p.vol);

        if (!ERC20Interface(p.cashTokenAddress).transferFrom(msg.sender, this, p.vol)) {
            return false;
        }

        pendingReturns[p.player][p.tokenAddress] += (p.farLegPrice * p.vol);
        pendingReturns[p.banker][p.cashTokenAddress] += p.vol;
        pendingReturns[p.banker][p.cashTokenAddress] += ((p.nearLegPrice-p.farLegPrice) * p.vol);

        p.state = 5;

        return true;
    }

    function forceCloseOnPrice(uint proposalId) public returns(bool) {

        Proposal storage p = proposals[proposalId];
        require(p.exists);
        require(p.state == 1);
        require(currentPrice > p.triggerPrice);
        require(p.banker == msg.sender);

        pendingReturns[p.banker][p.tokenAddress] += (p.nearLegPrice * p.vol);

        p.state = 4;

        return true;
    }

    function forceCloseOnExpiry(uint proposalId) public returns(bool) {

        Proposal storage p = proposals[proposalId];
        require(p.exists);
        require(p.state == 1);
        require(now > (p.startTime + p.term));
        require(p.banker == msg.sender);

        pendingReturns[p.banker][p.tokenAddress] += (p.nearLegPrice * p.vol);

        p.state = 3;

        return true;
    }

    function cancelProposal(uint proposalId) public returns (bool) {

        Proposal storage p = proposals[proposalId];

        require(p.exists);
        require(p.state == 0);
        require(p.banker == msg.sender);

        pendingReturns[p.banker][p.cashTokenAddress] += p.vol;

        p.state = 2;

        return true;
    }

    function withdraw(address tokenAddress) public returns (bool) {

        uint amount = pendingReturns[msg.sender][tokenAddress];

        if (amount > 0) {

            pendingReturns[msg.sender][tokenAddress] = 0;

            if (!ERC20Interface(tokenAddress).transferFrom(this, msg.sender, amount)) {
                pendingReturns[msg.sender][tokenAddress] = amount;
                return false;
            }

        }
        return true;
    }

    function __callback(bytes32, string result) public {

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
    }

}
