App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // TODO: refactor conditional
    ethereum.enable();
    if (window.ethereum) {
      window.web3 = new Web3(ethereum);
      if (typeof web3 !== 'undefined') {
        // If a web3 instance is already provided by Meta Mask.
        App.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
        console.log("WEB3 ACCOUNTS", web3.eth.accounts);
      } else {
        // Specify default instance if no web3 instance provided
        App.web3Provider = new Web3.providers.HttpProvider('https://testnetv3.matic.network');
        web3 = new Web3(App.web3Provider);
        console.log(web3);
      }
    } else {
      alert('This application needs MetaMask in order to work');
    }

    console.log("RETURNING")

    return App.initContract();
},

  initContract: function() {
    $.getJSON("Election.json", function (election) {

      console.log("\nElection\n", election)


      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

// Listen for events emitted from the contract
listenForEvents: function() {
  App.contracts.Election.deployed().then(function (instance) {
    // Restart Chrome if you are unable to receive this event
    // This is a known issue with Metamask
    // https://github.com/MetaMask/metamask-extension/issues/2393
    instance.votedEvent({}, {
      fromBlock: 0,
      toBlock: 'latest'
    }).watch(function (error, event) {
      // console.log("event triggered", event)
      // Reload when a new vote is recorded
      App.render();
    });
  });
},

render: function() {
  var electionInstance;
  var loader = $("#loader");
  var content = $("#content");

  loader.show();
  content.hide();

  // Load account data
  web3.eth.getCoinbase(function (err, account) {
    if (err === null) {
      App.account = account;
      console.log("\n", App.account, "\n")
      $("#accountAddress").html("Your Account: " + account);
    }
  });

  // Load contract data
  App.contracts.Election.deployed().then(function (instance) {
    electionInstance = instance;
    console.log("\n", App.account, "\n")
    return electionInstance.candidatesCount();
  }).then(function (candidatesCount) {
    var candidatesResults = $("#candidatesResults");
    candidatesResults.empty();

    var candidatesSelect = $('#candidatesSelect');
    candidatesSelect.empty();
    console.log("\n", App.account, "\n")


    for (var i = 1; i <= candidatesCount; i++) {
      electionInstance.candidates(i).then(function (candidate) {
        var id = candidate[0];
        var name = candidate[1];
        var voteCount = candidate[2];

        // Render candidate Result
        var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
        candidatesResults.append(candidateTemplate);

        // Render candidate ballot option
        var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        candidatesSelect.append(candidateOption);
      });
    }
    return electionInstance.voters(App.account);
  }).then(function (hasVoted) {
    // Do not allow a user to vote
    if (hasVoted) {
      $('form').hide();
    }
    console.log("\n", App.account, "\n")

    loader.hide();
    content.show();
  }).catch(function (error) {
    console.warn(error);
  });
},

castVote: function() {
  var candidateId = $('#candidatesSelect').val();
  App.contracts.Election.deployed().then(function (instance) {
    return instance.vote(candidateId, { from: App.account });
  }).then(function (result) {
    // Wait for votes to update
    $("#content").hide();
    $("#loader").show();
  }).catch(function (err) {
    console.error(err);
  });
}
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});