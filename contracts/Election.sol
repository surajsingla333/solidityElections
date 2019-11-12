pragma solidity ^0.5.0;

contract Election
{
    //Model candidate
    struct Candidate {
        uint id;
        string candidateName;
        int256 voteCount;
    }
    //store, fetch candidate
    mapping(uint => Candidate) public candidates;
    
    //store voted accounts
    mapping(address => bool) public voters;
    // Store candidates count
    uint public candidatesCount;

    //voted event
    event votedEvent (
        uint indexed _candidateId
    );

    constructor () public { 
        addCandidate("C1");
        addCandidate("C2");
    }

    function addCandidate (string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote (uint _candidateId) public {
        //require they didnt voted earlier
        require(!voters[msg.sender]);
        
        //require valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        //record that voter has voted
        voters[msg.sender] = true;

        //update candidate votecount
        candidates[_candidateId].voteCount++;

        //trigger voted event
        emit votedEvent(_candidateId);

    } 
} 