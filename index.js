const express = require("express");
const cors = require("cors");


class Player {
	/** @param {string} id */
	constructor (id) {
		this.id = id;
		this.x = -1;
		this.y = -1;
		this.mokepon = null;
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


server.get("/join", (req, res) => {
	const id = `${random(1000, 9999)}`;
	const player = new Player(id);

	players.push(player);

	console.log(`Player with ID ${id} joined the game!`);

	res.status(200)
		.json({ playerId: id })
		.end();
});

server.post("/mokepon/:playerId", (req, res) => {
	const { playerId } = req.params;
	const name = req.body.mokepon;
	const currentPlayer = players.find((player) => (player.id === playerId));

	if (!currentPlayer) 
		res.status(404).end();
	
	currentPlayer.mokepon = new Mokepon(name);

	res.status(200).end();
});

server.post("/map/:playerId", (req, res) => {
	const { playerId } = req.params;
	const { x, y } = req.body;
	const currentPlayer = players.find((player) => (player.id === playerId));

	if (!currentPlayer)
		res.status(404).end();

	currentPlayer.moveTo(x, y);

	const opponents = players.filter((player) => (player.id !== currentPlayer.id));

	res.status(200).json({ opponents }).end();
});

server.listen(8080, () => {
	console.log("Server listening on port 8080");
});
