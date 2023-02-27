const path = require("node:path");
const express = require("express");
const cors = require("cors");


/** @type {Player[]} */
const players = [];


const server = express();

server.use(cors());
server.use(express.json());
server.use(express.static(path.join(__dirname, "public")));


/**
 * Generates an ID for the player and adds it to the players list.
 */
server.get("/join", (req, res) => {
	let id = null;

	// Generates a random number between 1000 and 9999 that hasn't
	// been used before by another player.
	while (id === null) {
		id = `${random(1000, 9999)}`;

		if (players.find((player) => (player.id === id)))
			id = null;
	}
	
	const player = new Player(id);

	players.push(player);

	res.status(200)
		.json({ playerId: id })
		.end();
});


/**
 * Updates a player's mokepon to the one specified.
 */
server.post("/mokepon/:playerId", (req, res) => {
	const { playerId } = req.params;
	const name = req.body.mokepon;
	const currentPlayer = players.find((player) => (player.id === playerId));

	if (!currentPlayer) {
		res.status(404).end();
		return; 
	}
	
	currentPlayer.mokepon = new Mokepon(name);

	res.status(200).end();
});


/**
 * Keeps track of the position of each player in the map.
 */
server.post("/map/:playerId", (req, res) => {
	const { playerId } = req.params;
	const { x, y } = req.body;

	const currentPlayer = players.find((player) => (player.id === playerId));

	if (!currentPlayer) {
		res.status(404).end();
		return; 
	}

	currentPlayer.moveTo(x, y);

	const opponents = players.filter((player) => (player.id !== playerId));

	res.status(200)
		.json({ opponents, battling: currentPlayer.opponent })
		.end();
});


/**
 * Updates the state of player and opponent to indicate that they are now in battle.
 */
server.post("/battle/start", (req, res) => {
	const { playerId, opponentId } = req.body;

	const currentPlayer = players.find((player) => (player.id === playerId));
	const currentOpponent = players.find((player) => (player.id === opponentId));

	if (!currentPlayer || !currentOpponent) {
		res.status(404).end();
		return;
	}

	currentPlayer.opponent = opponentId;
	currentOpponent.opponent = playerId;

	res.status(200).end();
});

/**
 * Sets the state of the player back to normal, the battle is over.
 */
server.get("/battle/:playerId/end", (req, res) => {
	const { playerId } = req.params;

	const currentPlayer = players.find((player) => (player.id === playerId));

	if (!currentPlayer) {
		res.status(404).end();
		return;
	}

	currentPlayer.opponent = null;
	currentPlayer.attacks = [];

	res.status(200).end();
});

/**
 * Registers the selected attacks by the player.
 */
server.post("/battle/:playerId", (req, res) => {
	const { playerId } = req.params;
	const { attacks } = req.body;

	const currentPlayer = players.find((player) => (player.id === playerId));

	if (!currentPlayer) {
		res.status(404).end();
		return;
	}

	currentPlayer.attacks = attacks;

	res.status(200).end();
});

/**
 * Returns the requested attacks by a player (the opponent's attacks in this case).
 */
server.get("/battle/:playerId", (req, res) => {
	const { playerId } = req.params;
	
	const requestedPlayer = players.find((player) => (player.id === playerId));

	if (!requestedPlayer) {
		res.status(404).end();
		return;
	}

	res.status(200)
		.json({ attacks: requestedPlayer.attacks })
		.end();
});


server.listen(8080, () => {
	console.log("Server listening on port 8080");
});


/**
 * Represents a player in the game.
 */
class Player {
	/** @param {string} id */
	constructor (id) {
		this.id = id;
		this.x = -1;
		this.y = -1;
		this.mokepon = null;
		this.opponent = null;
		this.attacks = [];
	}

	moveTo (x, y) {
		this.x = x;
		this.y = y;
	}
}

/**
 * A mokepon or something.
 */
class Mokepon {
	/** @param {string} name */
	constructor (name) {
		this.name = name;
	}
}


/**
 * Hello World!
 * @param {number} min The minimum amount of Hello Worlds to generate.
 * @param {number} max The maximum amount of Hello Worlds to generate.
 */
function random (min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
