pragma solidity ^0.4.11; // solhint-disable-line compiler-fixed
//import "./oraclizeAPI_0.5.sol"; // solhint-disable-line


//contract Badla is usingOraclize {
contract Badla {

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

        //0 -> new, 1-> accepted, 2->cancelled, 3->force on expiry, 4-> force on price, 5->settled

        uint startTime;
    }

    mapping(uint => Proposal) public proposals;
    mapping(address => uint) public cashBalances;
    mapping(address => uint) public tokenBalances;

    uint public proposalCount;

    event LogNewOraclizeQuery(string description);

    function createProposal(uint nearLegPrice,
                            uint term,
                            uint farLegPrice,
                            uint triggerPrice) public payable returns (uint proposalId) {


        //Todo: TokenPair types should be captured and validated
        require(nearLegPrice > farLegPrice);

        Proposal storage p = proposals[proposalCount];
        p.exists = true;
        p.proposalId = proposalCount++;
        p.banker = msg.sender;
        p.vol = msg.value;
        p.term = term * 3600;
        p.nearLegPrice = nearLegPrice;
        p.farLegPrice = farLegPrice;
        p.triggerPrice = triggerPrice;
        p.state = 0;

        return p.proposalId;
    }

    function acceptProposal(uint proposalId, uint startTime) public payable returns (bool) {

        Proposal memory p = proposals[proposalId];
        require(p.exists);
        require(msg.value == p.nearLegPrice);
        require(p.state == 0);

        cashBalances[msg.sender] += p.vol;

        p.player = msg.sender;
        p.startTime = startTime;
        p.state = 1;

        return true;
    }

    function settleProposal(uint proposalId) public payable returns(bool) {

        Proposal memory p = proposals[proposalId];
        require(p.exists);
        require(p.state == 1);
        require(msg.value == p.vol);

        tokenBalances[msg.sender] += p.farLegPrice;
        cashBalances[p.banker] += p.vol;
        tokenBalances[p.banker] += (p.nearLegPrice-p.farLegPrice);

        p.state = 5;

        return true;
    }

    function forceCloseOnPrice(uint proposalId) public returns(bool) {

        Proposal memory p = proposals[proposalId];
        require(p.exists);
        require(p.state == 1);
        require(currentPrice > p.triggerPrice);

        tokenBalances[p.banker] += p.nearLegPrice;

        p.state = 4;

        return true;
    }

    function forceCloseOnExpiry(uint proposalId) public returns(bool) {

        Proposal memory p = proposals[proposalId];
        require(p.exists);
        require(p.state == 1);
        require(now > p.startTime + p.term);

        tokenBalances[p.banker] += p.nearLegPrice;

        p.state = 3;
        return true;
    }

    function cancelProposal(uint proposalId) public returns (bool) {

        Proposal memory p = proposals[proposalId];
        require(p.exists);
        require(p.state == 0);

        cashBalances[p.banker] += p.vol;

        p.state = 2;
        return true;
    }

    function withdrawCash() public returns (bool) {

        uint amount = cashBalances[msg.sender];

        if (amount > 0) {

            cashBalances[msg.sender] = 0;

            if (!msg.sender.send(amount)) {
                cashBalances[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    function withdrawTokens() public returns (bool) {

        uint amount = tokenBalances[msg.sender];

        if (amount > 0) {

            tokenBalances[msg.sender] = 0;

            if (!msg.sender.send(amount)) {
                tokenBalances[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    /*function __callback(bytes32, string result) public {

        if (msg.sender != oraclize_cbAddress()) revert();

        currentPrice = stringToUint(result);

        updatePrice();
    }

    function updatePrice() public payable {

        if (oraclize_getPrice("URL") > this.balance) {
            LogNewOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
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

}
