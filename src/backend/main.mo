import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Order "mo:core/Order";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";



actor {
  type Team = {
    id : Nat;
    name : Text;
    purse_total : Nat;
    purse_remaining : Nat;
    players_bought : Nat;
    owner_name : Text;
    icon_player_name : Text;
    is_locked : Bool;
  };

  module Team {
    public func compare(team1 : Team, team2 : Team) : Order.Order {
      Nat.compare(team1.id, team2.id);
    };
  };

  type Player = {
    id : Nat;
    name : Text;
    category : Text;
    base_price : Nat;
    image_url : Text;
    sold_price : ?Nat;
    sold_to : ?Nat;
    status : Text;
    rating : Nat;
  };

  type AuctionState = {
    current_player_id : ?Nat;
    current_bid : Nat;
    leading_team_id : ?Nat;
    is_active : Bool;
  };

  public type Result = { #ok; #err : Text };

  let teams = Map.empty<Nat, Team>();
  let players = Map.empty<Nat, Player>();

  var auctionState : AuctionState = {
    current_player_id = null;
    current_bid = 0;
    leading_team_id = null;
    is_active = false;
  };

  var nextPlayerId = 1;

  func seedTeams() {
    let teamData = [
      (1, "Mumbai Warriors", "Rohit Sharma", "Virat Kohli"),
      (2, "Chennai Kings", "MS Dhoni", "Ravindra Jadeja"),
      (3, "Delhi Capitals", "Rishabh Pant", "Shikhar Dhawan"),
      (4, "Bangalore Challengers", "Virat Kohli", "AB de Villiers"),
      (5, "Kolkata Knight Riders", "Dinesh Karthik", "Andre Russell"),
      (6, "Punjab Kings", "KL Rahul", "Chris Gayle"),
      (7, "Hyderabad Sunrisers", "David Warner", "Kane Williamson"),
      (8, "Jaipur Royals", "Sanju Samson", "Jos Buttler"),
      (9, "Lucknow Super Giants", "KL Rahul", "Marcus Stoinis"),
      (10, "Gujarat Titans", "Hardik Pandya", "Shubman Gill"),
    ];

    for ((id, name, owner, icon) in teamData.values()) {
      let team : Team = {
        id;
        name;
        purse_total = 20500;
        purse_remaining = 20000;
        players_bought = 0;
        owner_name = owner;
        icon_player_name = icon;
        is_locked = false;
      };
      teams.add(id, team);
    };
  };

  func seedPlayers() {
    let playerData : [(Text, Text, Nat, Text, Nat)] = [
      ("Rohit Sharma", "Batsman", 300, "url1", 5),
      ("Jasprit Bumrah", "Bowler", 300, "url2", 4),
      ("Surya Yadav", "Batsman", 200, "url3", 4),
      ("Ishan Kishan", "Batsman", 200, "url4", 3),
      ("Hardik Pandya", "Allrounder", 300, "url5", 5),
      ("Rahul Chahar", "Bowler", 100, "url6", 3),
      ("Trent Boult", "Bowler", 300, "url7", 4),
      ("Krunal Pandya", "Allrounder", 200, "url8", 3),
      ("Kieron Pollard", "Allrounder", 300, "url9", 5),
      ("Nathan Coulter-Nile", "Allrounder", 100, "url10", 3),
    ];

    for ((name, category, base_price, image_url, rating) in playerData.values()) {
      let player = {
        id = nextPlayerId;
        name;
        category;
        base_price;
        image_url;
        sold_price = null;
        sold_to = null;
        status = "upcoming";
        rating;
      };
      players.add(nextPlayerId, player);
      nextPlayerId += 1;
    };
  };

  seedTeams();
  seedPlayers();

  func updatePlayerStatus(playerId : Nat, status : Text) {
    switch (players.get(playerId)) {
      case (?player) {
        let updatedPlayer = { player with status };
        players.add(playerId, updatedPlayer);
      };
      case (null) { Runtime.trap("Player not found") };
    };
  };

  func calculateRemainingRequirement(team : Team) : Nat {
    let playersNeeded = 7 - team.players_bought;
    playersNeeded * 100;
  };

  public shared ({ caller }) func adminLogin(password : Text) : async Bool {
    password == "SPL@2025";
  };

  public query ({ caller }) func getTeams() : async [Team] {
    teams.values().toArray().sort();
  };

  public query ({ caller }) func getPlayers() : async [Player] {
    players.values().toArray();
  };

  public query ({ caller }) func getAuctionState() : async AuctionState {
    auctionState;
  };

  public shared ({ caller }) func selectPlayer(playerId : Nat) : async Result {
    switch (players.get(playerId)) {
      case (?player) {
        if (player.status != "upcoming") {
          #err("Player is not available for auction");
        } else {
          updatePlayerStatus(playerId, "live");
          auctionState := {
            auctionState with
            current_player_id = ?playerId;
            current_bid = player.base_price;
            leading_team_id = null;
            is_active = true;
          };
          #ok;
        };
      };
      case (null) { #err("Player not found") };
    };
  };

  public shared ({ caller }) func placeBid(teamId : Nat) : async Result {
    switch (teams.get(teamId)) {
      case (?team) {
        if (team.is_locked) {
          return #err("Team is already locked");
        };

        let newBid = auctionState.current_bid + 100;
        if (team.purse_remaining < newBid) {
          return #err("Insufficient funds for this bid");
        };

        let remainingRequirement = calculateRemainingRequirement(team);
        if (
          team.purse_remaining - newBid < remainingRequirement
        ) {
          return #err("Bid would violate remaining purse requirements");
        };

        auctionState := {
          auctionState with
          current_bid = newBid;
          leading_team_id = ?teamId;
        };

        #ok;
      };
      case (null) { #err("Team not found") };
    };
  };

  public shared ({ caller }) func sellPlayer() : async Result {
    if (not auctionState.is_active) {
      return #err("No active auction");
    };

    switch (
      (auctionState.current_player_id, auctionState.leading_team_id)
    ) {
      case (?playerId, ?teamId) {
        switch ((players.get(playerId), teams.get(teamId))) {
          case (?player, ?team) {
            let updatedTeam = {
              team with
              purse_remaining = team.purse_remaining - auctionState.current_bid;
              players_bought = team.players_bought + 1;
              is_locked = team.players_bought + 1 == 7;
            };
            teams.add(teamId, updatedTeam);

            let updatedPlayer = {
              player with
              sold_price = ?auctionState.current_bid;
              sold_to = ?teamId;
              status = "sold";
            };
            players.add(playerId, updatedPlayer);

            auctionState := {
              current_player_id = null;
              current_bid = 0;
              leading_team_id = null;
              is_active = false;
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

  public shared ({ caller }) func resetAuction() : async () {
    for ((id, team) in teams.entries()) {
      let resetTeam = {
        team with
        purse_remaining = 20000;
        players_bought = 0;
        is_locked = false;
      };
      teams.add(id, resetTeam);
    };

    for ((id, player) in players.entries()) {
      let resetPlayer = {
        player with
        status = "upcoming";
        sold_price = null;
        sold_to = null;
      };
      players.add(id, resetPlayer);
    };

    auctionState := {
      current_player_id = null;
      current_bid = 0;
      leading_team_id = null;
      is_active = false;
    };
  };

  public shared ({ caller }) func editTeamPurse(teamId : Nat, newPurse : Nat) : async Result {
    switch (teams.get(teamId)) {
      case (?team) {
        let updatedTeam = { team with purse_remaining = newPurse };
        teams.add(teamId, updatedTeam);
        #ok;
      };
      case (null) { #err("Team not found") };
    };
  };

  public query ({ caller }) func getResults() : async [(Player, ?Team)] {
    let soldPlayers = players.values().toList<Player>();
    let filteredSoldPlayers = soldPlayers.filter(func(player) { player.status == "sold" });

    let results = List.empty<(Player, ?Team)>();
    for (player in filteredSoldPlayers.values()) {
      let team = switch (player.sold_to) {
        case (null) { null };
        case (?teamId) { teams.get(teamId) };
      };
      results.add((player, team));
    };
    results.toArray();
  };

  type Dashboard = {
    total_spent : Nat;
    most_expensive_player : ?Player;
    remaining_players : Nat;
    sold_players : Nat;
  };

  public query ({ caller }) func getDashboard() : async Dashboard {
    let allPlayers = players.values().toList<Player>();

    var totalSpent = 0;
    var mostExpensivePrice = 0;
    var mostExpensivePlayer : ?Player = null;

    let remainingPlayers = allPlayers.filter(func(player) { player.status == "upcoming" }).size();
    let soldPlayers = allPlayers.filter(func(player) { player.status == "sold" }).size();

    allPlayers.values().forEach(
      func(player) {
        switch (player.sold_price) {
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
      total_spent = totalSpent;
      most_expensive_player = mostExpensivePlayer;
      remaining_players = remainingPlayers;
      sold_players = soldPlayers;
    };
  };

  public shared ({ caller }) func updateTeam(teamId : Nat, name : Text, ownerName : Text, iconPlayerName : Text) : async Result {
    switch (teams.get(teamId)) {
      case (?team) {
        let updatedTeam = {
          team with
          name;
          owner_name = ownerName;
          icon_player_name = iconPlayerName;
        };
        teams.add(teamId, updatedTeam);
        #ok;
      };
      case (null) { #err("Team not found") };
    };
  };

  public shared ({ caller }) func addPlayer(name : Text, category : Text, basePrice : Nat, imageUrl : Text, rating : Nat) : async Result {
    let player = {
      id = nextPlayerId;
      name;
      category;
      base_price = basePrice;
      image_url = imageUrl;
      sold_price = null;
      sold_to = null;
      status = "upcoming";
      rating;
    };
    players.add(nextPlayerId, player);
    nextPlayerId += 1;
    #ok;
  };

  public shared ({ caller }) func updatePlayer(playerId : Nat, name : Text, category : Text, basePrice : Nat, imageUrl : Text, rating : Nat) : async Result {
    switch (players.get(playerId)) {
      case (?player) {
        if (player.status == "live") {
          return #err("Cannot update player during live auction");
        };
        let updatedPlayer = {
          player with
          name;
          category;
          base_price = basePrice;
          image_url = imageUrl;
          rating;
        };
        players.add(playerId, updatedPlayer);
        #ok;
      };
      case (null) { #err("Player not found") };
    };
  };

  public shared ({ caller }) func deletePlayer(playerId : Nat) : async Result {
    switch (players.get(playerId)) {
      case (?player) {
        if (player.status == "live") {
          return #err("Cannot delete player during live auction");
        };
        players.remove(playerId);
        #ok;
      };
      case (null) { #err("Player not found") };
    };
  };
};
