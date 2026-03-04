import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";


// Apply the data migration from an earlier version in the `with` clause

actor {
  include MixinStorage();

  type TeamId = Nat;
  type PlayerId = Nat;
  type Amount = Nat;
  type Rating = Nat;
  type Category = {
    #batsman;
    #bowler;
    #allrounder;
  };
  type Status = {
    #upcoming;
    #live;
    #sold;
    #unsold;
  };
  type TeamLogo = ?Storage.ExternalBlob;
  type Team = {
    id : TeamId;
    name : Text;
    purseAmountTotal : Amount;
    purseAmountLeft : Amount;
    numberOfPlayers : Nat;
    ownerName : Text;
    teamIconPlayer : Text;
    isTeamLocked : Bool;
    teamLogo : TeamLogo;
  };
  type Player = {
    id : PlayerId;
    name : Text;
    category : Category;
    basePrice : Amount;
    imageUrl : Text;
    soldPrice : ?Amount;
    soldTo : ?TeamId;
    status : Status;
    rating : Rating;
  };

  type AuctionState = {
    currentPlayerId : ?PlayerId;
    currentBid : Amount;
    leadingTeamId : ?TeamId;
    isActive : Bool;
  };

  type Result = {
    #ok;
    #err : Text;
  };

  type Dashboard = {
    totalSpent : Amount;
    mostExpensivePlayer : ?Player;
    remainingPlayers : Nat;
    soldPlayers : Nat;
    unsoldPlayers : Nat;
  };

  type PlayerWithTeam = {
    player : Player;
    team : ?Team;
  };

  let teams = Map.empty<TeamId, Team>();
  let players = Map.empty<PlayerId, Player>();

  var auctionState : AuctionState = {
    currentPlayerId = null;
    currentBid = 0;
    leadingTeamId = null;
    isActive = false;
  };

  var nextPlayerId = 71;
  var leagueSettingsJson = "";

  func seedTeams() {
    let teamData : [(Nat, Text, Text, Text)] = [
      (1, "Mumbai Warriors", "Team Owner 1", "Icon Player 1"),
      (2, "Chennai Kings", "Team Owner 2", "Icon Player 2"),
      (3, "Delhi Capitals", "Team Owner 3", "Icon Player 3"),
      (4, "Bangalore Challengers", "Team Owner 4", "Icon Player 4"),
      (5, "Kolkata Knight Riders", "Team Owner 5", "Icon Player 5"),
      (6, "Punjab Kings", "Team Owner 6", "Icon Player 6"),
      (7, "Hyderabad Sunrisers", "Team Owner 7", "Icon Player 7"),
      (8, "Jaipur Royals", "Team Owner 8", "Icon Player 8"),
      (9, "Lucknow Super Giants", "Team Owner 9", "Icon Player 9"),
      (10, "Gujarat Titans", "Team Owner 10", "Icon Player 10"),
    ];

    for ((id, name, owner, icon) in teamData.values()) {
      let team : Team = {
        id;
        name;
        purseAmountTotal = 20500;
        purseAmountLeft = 20000;
        numberOfPlayers = 0;
        ownerName = owner;
        teamIconPlayer = icon;
        isTeamLocked = false;
        teamLogo = null;
      };
      teams.add(id, team);
    };
  };

  func seedPlayers() {
    let playerNames : [Text] = [
      "Rohit Sharma",
      "Virat Kohli",
      "MS Dhoni",
      "Ravindra Jadeja",
      "Jasprit Bumrah",
      "KL Rahul",
      "Hardik Pandya",
      "Suryakumar Yadav",
      "Shubman Gill",
      "Rishabh Pant",
      "Sanju Samson",
      "Jos Buttler",
      "Yashasvi Jaiswal",
      "Rinku Singh",
      "Shikhar Dhawan",
      "Yuzvendra Chahal",
      "Mohammed Shami",
      "Axar Patel",
      "Washington Sundar",
      "Kuldeep Yadav",
      "Bhuvneshwar Kumar",
      "Deepak Chahar",
      "Dinesh Karthik",
      "Venkatesh Iyer",
      "Krunal Pandya",
      "Ruturaj Gaikwad",
      "Arshdeep Singh",
      "Harshal Patel",
      "Shardul Thakur",
      "Trent Boult",
      "Shimron Hetmyer",
      "Ravichandran Ashwin",
      "Varun Chakravarthy",
      "Quinton de Kock",
      "Marcus Stoinis",
      "Jason Holder",
      "Devdutt Padikkal",
      "Prasidh Krishna",
      "Avesh Khan",
      "T Natarajan",
      "Shahbaz Ahmed",
      "Tushar Deshpande",
      "Riyan Parag",
      "Tilak Varma",
      "Rahul Tewatia",
      "Shivam Mavi",
      "Harpreet Brar",
      "Mohit Sharma",
      "Karun Nair",
      "Dhruv Jurel",
      "Mayank Agarwal",
      "Ravi Bishnoi",
      "Nicholas Pooran",
      "Alzarri Joseph",
      "Amit Mishra",
      "Sandeep Sharma",
      "Luvnith Sisodia",
      "Raj Bawa",
      "Rajat Patidar",
      "Naman Dhir",
      "Umesh Yadav",
      "Manish Pandey",
      "Kedar Jadhav",
      "Ambati Rayudu",
      "Robin Uthappa",
      "Nitish Rana",
      "Srikar Bharat",
      "Prithvi Shaw",
      "Shreyas Iyer",
      "Ishan Kishan",
    ];

    let playerData : [(Category, Amount, Rating)] = [
      (#batsman, 500, 5),
      (#batsman, 500, 5),
      (#batsman, 400, 5),
      (#allrounder, 400, 5),
      (#bowler, 400, 5),
      (#batsman, 400, 4),
      (#allrounder, 400, 5),
      (#batsman, 400, 5),
      (#batsman, 400, 5),
      (#batsman, 400, 5),
      (#batsman, 400, 4),
      (#batsman, 400, 5),
      (#batsman, 400, 4),
      (#batsman, 300, 4),
      (#batsman, 300, 4),
      (#bowler, 300, 4),
      (#bowler, 300, 4),
      (#allrounder, 300, 4),
      (#allrounder, 300, 4),
      (#bowler, 300, 4),
      (#bowler, 300, 4),
      (#bowler, 300, 4),
      (#batsman, 300, 4),
      (#allrounder, 300, 4),
      (#allrounder, 300, 3),
      (#batsman, 300, 4),
      (#bowler, 300, 4),
      (#bowler, 300, 4),
      (#allrounder, 300, 4),
      (#bowler, 400, 4),
      (#batsman, 300, 4),
      (#bowler, 300, 4),
      (#bowler, 300, 4),
      (#batsman, 300, 4),
      (#allrounder, 300, 4),
      (#allrounder, 300, 4),
      (#batsman, 200, 3),
      (#bowler, 200, 3),
      (#bowler, 200, 3),
      (#bowler, 200, 3),
      (#allrounder, 200, 3),
      (#bowler, 200, 3),
      (#allrounder, 200, 3),
      (#batsman, 200, 3),
      (#allrounder, 200, 3),
      (#bowler, 200, 3),
      (#allrounder, 200, 3),
      (#bowler, 200, 3),
      (#batsman, 200, 3),
      (#batsman, 200, 3),
      (#batsman, 200, 3),
      (#bowler, 200, 3),
      (#batsman, 200, 3),
      (#bowler, 200, 3),
      (#bowler, 200, 3),
      (#bowler, 200, 3),
      (#batsman, 200, 3),
      (#allrounder, 200, 3),
      (#batsman, 300, 4),
      (#allrounder, 200, 3),
      (#bowler, 200, 3),
      (#batsman, 200, 3),
      (#allrounder, 200, 3),
      (#batsman, 200, 3),
      (#batsman, 200, 3),
      (#batsman, 200, 3),
      (#batsman, 200, 3),
      (#batsman, 300, 3),
      (#batsman, 300, 4),
      (#batsman, 300, 4),
    ];

    var id : Nat = 1;
    for (i in Nat.range(0, playerNames.size())) {
      if (i < playerData.size()) {
        let (category, basePrice, rating) = playerData[i];
        let player : Player = {
          id;
          name = playerNames[i];
          category;
          basePrice;
          imageUrl = "";
          soldPrice = null;
          soldTo = null;
          status = #upcoming;
          rating;
        };
        players.add(id, player);
        id += 1;
      };
    };
    nextPlayerId := id;
  };

  func updatePlayerStatus(playerId : PlayerId, status : Status) {
    switch (players.get(playerId)) {
      case (?player) {
        let updatedPlayer = { player with status };
        players.add(playerId, updatedPlayer);
      };
      case (null) {};
    };
  };

  func calculateRemainingRequirement(team : Team) : Amount {
    let playersNeeded = 7 - team.numberOfPlayers;
    playersNeeded * 100;
  };

  func bidIncrement(currentAmount : Amount) : Amount {
    currentAmount + 100;
  };

  func initializeState() {
    if (players.size() == 0 and teams.size() == 0) {
      seedTeams();
      seedPlayers();
      nextPlayerId := 71;
    };
  };

  // Inline initialization logic (no need for an explicit initialize function)
  do {
    initializeState();
  };

  public shared ({ caller }) func adminLogin(password : Text) : async Bool {
    password == "SPL@2026";
  };

  public query ({ caller }) func getTeams() : async [Team] {
    teams.values().toArray();
  };

  public query ({ caller }) func getPlayers() : async [Player] {
    players.values().toArray();
  };

  public query ({ caller }) func getAuctionState() : async AuctionState {
    auctionState;
  };

  public query ({ caller }) func getDashboard() : async Dashboard {
    let allPlayers = players.values().toList<Player>();

    var totalSpent = 0;
    var mostExpensivePrice = 0;
    var mostExpensivePlayer : ?Player = null;

    let remainingPlayers = allPlayers.filter(
      func(player) { player.status == #upcoming }
    ).size();

    let soldPlayers = allPlayers.filter(
      func(player) { player.status == #sold }
    ).size();

    let unsoldPlayers = allPlayers.filter(
      func(player) { player.status == #unsold }
    ).size();

    allPlayers.values().forEach(
      func(player) {
        switch (player.soldPrice) {
          case (?price) {
            totalSpent += price;
            if (price > mostExpensivePrice) {
              mostExpensivePrice := price;
              mostExpensivePlayer := ?player;
            };
          };
          case (null) {};
        };
      }
    );

    {
      totalSpent;
      mostExpensivePlayer;
      remainingPlayers;
      soldPlayers;
      unsoldPlayers;
    };
  };

  public query ({ caller }) func getTeamById(teamId : TeamId) : async ?Team {
    teams.get(teamId);
  };

  public query ({ caller }) func getPlayerById(playerId : PlayerId) : async ?Player {
    players.get(playerId);
  };

  public query ({ caller }) func getResults() : async [PlayerWithTeam] {
    let soldPlayers = List.fromIter<Player>(players.values());
    let filteredSoldPlayers = soldPlayers.filter(
      func(player) { player.status == #sold }
    );

    let results = List.empty<PlayerWithTeam>();
    for (player in filteredSoldPlayers.values()) {
      let team = switch (player.soldTo) {
        case (null) { null };
        case (?teamId) { teams.get(teamId) };
      };
      results.add({ player; team });
    };
    results.toArray();
  };

  public shared ({ caller }) func selectPlayer(playerId : PlayerId) : async Result {
    switch (players.get(playerId)) {
      case (?player) {
        if (player.status != #upcoming) {
          #err("Player is not available for auction");
        } else {
          updatePlayerStatus(playerId, #live);
          auctionState := {
            auctionState with
            currentPlayerId = ?playerId;
            currentBid = player.basePrice;
            leadingTeamId = null;
            isActive = true;
          };
          #ok;
        };
      };
      case (null) { #err("Player not found") };
    };
  };

  public shared ({ caller }) func placeBid(teamId : TeamId) : async Result {
    switch (teams.get(teamId)) {
      case (?team) {
        if (team.isTeamLocked) {
          return #err("Team is already locked");
        };

        let newBid = bidIncrement(auctionState.currentBid);
        if (team.purseAmountLeft < newBid) {
          return #err("Insufficient funds for this bid");
        };

        let remainingRequirement = calculateRemainingRequirement(team);
        if (
          team.purseAmountLeft - newBid < remainingRequirement
        ) {
          return #err("Bid would violate remaining purse requirements");
        };

        auctionState := {
          auctionState with
          currentBid = newBid;
          leadingTeamId = ?teamId;
        };

        #ok;
      };
      case (null) { #err("Team not found") };
    };
  };

  public shared ({ caller }) func sellPlayer() : async Result {
    if (not auctionState.isActive) {
      return #err("No active auction");
    };

    switch (
      (auctionState.currentPlayerId, auctionState.leadingTeamId)
    ) {
      case (?playerId, ?teamId) {
        switch ((players.get(playerId), teams.get(teamId))) {
          case (?player, ?team) {
            let updatedTeam = {
              team with
              purseAmountLeft = team.purseAmountLeft - auctionState.currentBid;
              numberOfPlayers = team.numberOfPlayers + 1;
              isTeamLocked = team.numberOfPlayers + 1 == 7;
            };
            teams.add(teamId, updatedTeam);

            let updatedPlayer = {
              player with
              soldPrice = ?auctionState.currentBid;
              soldTo = ?teamId;
              status = #sold;
            };
            players.add(playerId, updatedPlayer);

            auctionState := {
              currentPlayerId = null;
              currentBid = 0;
              leadingTeamId = null;
              isActive = false;
            };

            #ok;
          };
          case (null, _) { #err("Player not found") };
          case (_, null) { #err("Team not found") };
        };
      };
      case (_) { #err("Invalid auction state") };
    };
  };

  public shared ({ caller }) func markPlayerUnsold() : async Result {
    if (not auctionState.isActive) {
      return #err("No active auction");
    };

    switch (auctionState.currentPlayerId) {
      case (?playerId) {
        switch (players.get(playerId)) {
          case (?player) {
            let updatedPlayer = { player with status = #unsold };
            players.add(playerId, updatedPlayer);

            auctionState := {
              currentPlayerId = null;
              currentBid = 0;
              leadingTeamId = null;
              isActive = false;
            };

            #ok;
          };
          case (null) { #err("Player not found") };
        };
      };
      case (null) { #err("Invalid auction state") };
    };
  };

  public shared ({ caller }) func putPlayerBackToAuction(playerId : PlayerId) : async Result {
    switch (players.get(playerId)) {
      case (?player) {
        if (player.status == #unsold) {
          let updatedPlayer = { player with status = #upcoming };
          players.add(playerId, updatedPlayer);
          #ok;
        } else {
          #err("Player must be unsold to put back in auction");
        };
      };
      case (null) { #err("Player not found") };
    };
  };

  public shared ({ caller }) func unsellPlayer(playerId : PlayerId) : async Result {
    switch (players.get(playerId)) {
      case (?player) {
        switch (player.status) {
          case (#sold) {
            switch (player.soldPrice) {
              case (?finalPrice) {
                switch (player.soldTo) {
                  case (?teamId) {
                    switch (teams.get(teamId)) {
                      case (?team) {
                        let updatedTeam = {
                          team with
                          purseAmountLeft = team.purseAmountLeft + finalPrice;
                          numberOfPlayers = team.numberOfPlayers - 1;
                          isTeamLocked = false;
                        };

                        teams.add(teamId, updatedTeam);

                        let updatedPlayer = {
                          player with
                          soldPrice = null;
                          soldTo = null;
                          status = #upcoming;
                        };

                        players.add(playerId, updatedPlayer);

                        #ok;
                      };
                      case (null) { #err("Team not found") };
                    };
                  };
                  case (null) { #err("Invalid team data") };
                };
              };
              case (null) { #err("Invalid price data") };
            };
          };
          case (_) { #err("Player can only be unsold if status is sold") };
        };
      };
      case (null) { #err("Player not found") };
    };
  };

  public shared ({ caller }) func resetAuction() : async () {
    for ((id, team) in teams.entries()) {
      let resetTeam = {
        team with
        purseAmountLeft = 20000;
        numberOfPlayers = 0;
        isTeamLocked = false;
      };
      teams.add(id, resetTeam);
    };

    for ((id, player) in players.entries()) {
      let resetPlayer = {
        player with
        status = #upcoming;
        soldPrice = null;
        soldTo = null;
      };
      players.add(id, resetPlayer);
    };

    auctionState := {
      currentPlayerId = null;
      currentBid = 0;
      leadingTeamId = null;
      isActive = false;
    };
  };

  public shared ({ caller }) func editTeamPurse(teamId : TeamId, newPurse : Amount) : async Result {
    switch (teams.get(teamId)) {
      case (?team) {
        let updatedTeam = { team with purseAmountLeft = newPurse };
        teams.add(teamId, updatedTeam);
        #ok;
      };
      case (null) { #err("Team not found") };
    };
  };

  public shared ({ caller }) func updateTeam(teamId : TeamId, name : Text, ownerName : Text, iconPlayerName : Text) : async Result {
    switch (teams.get(teamId)) {
      case (?team) {
        let updatedTeam = {
          team with
          name;
          ownerName;
          teamIconPlayer = iconPlayerName;
        };
        teams.add(teamId, updatedTeam);
        #ok;
      };
      case (null) { #err("Team not found") };
    };
  };

  public shared ({ caller }) func uploadTeamLogo(teamId : TeamId, blob : Storage.ExternalBlob) : async Result {
    switch (teams.get(teamId)) {
      case (?team) {
        let updatedTeam = { team with teamLogo = ?blob };
        teams.add(teamId, updatedTeam);
        #ok;
      };
      case (null) { #err("Team not found") };
    };
  };

  public shared ({ caller }) func addPlayer(name : Text, category : Category, basePrice : Amount, imageUrl : Text, rating : Rating) : async Result {
    let player : Player = {
      id = nextPlayerId;
      name;
      category;
      basePrice;
      imageUrl;
      soldPrice = null;
      soldTo = null;
      status = #upcoming;
      rating;
    };
    players.add(nextPlayerId, player);
    nextPlayerId += 1;
    #ok;
  };

  public shared ({ caller }) func updatePlayer(playerId : PlayerId, name : Text, category : Category, basePrice : Amount, imageUrl : Text, rating : Rating) : async Result {
    switch (players.get(playerId)) {
      case (?player) {
        if (player.status == #live) {
          return #err("Cannot update player during live auction");
        };
        let updatedPlayer = {
          player with
          name;
          category;
          basePrice;
          imageUrl;
          rating;
        };
        players.add(playerId, updatedPlayer);
        #ok;
      };
      case (null) { #err("Player not found") };
    };
  };

  public shared ({ caller }) func deletePlayer(playerId : PlayerId) : async Result {
    switch (players.get(playerId)) {
      case (?player) {
        if (player.status == #live) {
          return #err("Cannot delete player during live auction");
        };
        players.remove(playerId);
        #ok;
      };
      case (null) { #err("Player not found") };
    };
  };

  public query ({ caller }) func getPlayersByCategory(category : Category) : async [Player] {
    let filteredPlayers = players.values().toList<Player>().filter(
      func(player) { player.category == category }
    );
    filteredPlayers.toArray();
  };

  public query ({ caller }) func getRemainingPurse(teamId : TeamId) : async ?Amount {
    switch (teams.get(teamId)) {
      case (?team) { ?team.purseAmountLeft };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveSettings(json : Text) : async () {
    leagueSettingsJson := json;
  };

  public query ({ caller }) func getSettings() : async Text {
    leagueSettingsJson;
  };

  public shared ({ caller }) func initialize() : async Bool { true };
};
