const path = require("node:path");
const express = require("express");
const cors = require("cors");


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

class Mokepon {
	/** @param {string} name */
	constructor (name) {
		this.name = name;
	}
}


function random (min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}


/** @type {Player[]} */
const players = [];


const server = express();

server.use(cors());
server.use(express.json());
server.use(express.static(path.join(__dirname, "public")));


server.get("/join", (req, res) => {
	let id = null;

	while (id === null) {
		id = `${random(1000, 9999)}`;

		if (players.find((player) => (player.id === id)))
			id = null;
	}
	
	const player = new Player(id);

	players.push(player);

	console.log(`Player with ID ${id} joined the game!`);

	res.status(200)
		.json({ playerId: id })
		.end();
});

server.get("/disconnect", (req, res) => {
	const { id } = req.body;

	const currentPlayer = players.find((player) => (player.id === id));

	if (!currentPlayer) {
		res.status(404).end();
		return;
	}

	players.splice(players.indexOf(currentPlayer), 1);
});

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
