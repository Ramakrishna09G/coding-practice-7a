const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const covertDBPlayersListObjectToResponseObject = (dbOject) => {
  return {
    playerId: dbOject.player_id,
    playerName: dbOject.player_name,
  };
};

const covertDBMatchObjectToResponseObject = (dbOject) => {
  return {
    matchId: dbOject.match_id,
    match: dbOject.match,
    year: dbOject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      covertDBPlayersListObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
    *
    FROM
    player_details
    WHERE
    player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(covertDBPlayersListObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
    *
    FROM
    match_details
    WHERE
    match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(covertDBMatchObjectToResponseObject(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchListQuery = `
    SELECT
    *
    FROM
    match_details
    NATURAL JOIN
    player_match_score
    WHERE
    player_id = ${playerId};
    `;
  const matchList = await database.all(getMatchListQuery);
  response.send(
    matchList.map((eachList) => covertDBMatchObjectToResponseObject(eachList))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerListQuery = `
    SELECT
    *
    FROM
    player_details
    NATURAL JOIN
    player_match_score
    WHERE
    match_id = ${matchId};
    `;
  const playerList = await database.all(getPlayerListQuery);
  response.send(
    playerList.map((eachList) =>
      covertDBPlayersListObjectToResponseObject(eachList)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatiticsQuery = `
    SELECT
    player_id as playerId,
    player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    FROM
    player_details
    NATURAL JOIN
    player_match_score
    WHERE
    player_id = ${playerId}
    GROUP BY
    player_id;
    `;
  const statitics = await database.get(getStatiticsQuery);
  response.send(statitics);
});

module.exports = app;
