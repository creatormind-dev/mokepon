"use strict";

/** @type {typeof document.querySelector} */
const $ = document.querySelector.bind(document);


// #region HTML_VARIABLES
const btnMokeponSelect = $("#mokepon-select");
const btnRestart = $("#restart-game");
const btnContinue = $("#continue-game");

const inputPlayerWin = $("#player-win");
const inputOpponentWin = $("#opponent-win");

const sectionChooseMokepon = $("#choose-mokepon");
const sectionChooseAttack = $("#choose-attack");
const sectionMapView = $("#map-view");

const mokeponCardsContainer = $("#mokepon-cards");

const spanPlayerMokepon = $("#player-mokepon");
const spanPlayerWins = $("#player-wins");
const spanOpponentMokepon = $("#opponent-mokepon");
const spanOpponentWins = $("#opponent-wins");

const imgPlayerMokepon = $("#player-mokepon-img");
const imgOpponentMokepon = $("#opponent-mokepon-img");

const h3Result = $("#result");

/** @type {HTMLCanvasElement} */
const canvasMap = $("#map");

/** @type {HTMLButtonElement[]} */
const attackButtons = [];
// #endregion


/** @type {Player?} */
let player = null;
/** @type {Player?} */
let currentOpponent = null;

/** @type {Player[]} */
const opponents = [];


const fire = new Attack("fire", "🔥", 1);
const water = new Attack("water", "💧", 2);
const earth = new Attack("earth", "🌵", 3);

const hipodoge = new Mokepon("Hipodoge", [ water, water, water, fire, earth ]);
const capipepo = new Mokepon("Capipepo", [ earth, earth, earth, fire, water ]);
const ratigueya = new Mokepon("Ratigueya", [ fire, fire, fire, water, earth ]);
// const langostelvis = new Mokepon("Langostelvis", [ fire, fire, water, water, earth ]);
// const tucapalma = new Mokepon("Tucapalma", [ earth, earth, water, water, fire ]);
// const pydos = new Mokepon("Pydos", [ fire, fire, earth, earth, water ]);

const MOKEPONS = [ hipodoge, capipepo, ratigueya, /* tucapalma, langostelvis, pydos */ ];


let mapRefreshInterval = null;
let battleFetchInterval = null;


/**
 * Makes an HTTP request to the specified endpoint of the API server and returns
 * the response of the request.
 * @param {string} endpoint The endpoint to make the request to.
 * @param {"get"|"post"|"put"|"patch"|"delete"} method Which HTTP method to use.
 * @param {object?} data Additional data to send (not applicable with GET requests).
 * @returns The {@link Response} object of the HTTP request.
 */
async function f (endpoint, method = "get", data = null) {
	const url = new URL(`http://${location.hostname}:8080/${endpoint}`);
	const headers = new Headers();
	let body = null;

	if (data && method !== "get") {
		body = JSON.stringify(data);
		headers.set("Content-Type", "application/json");
	}

	const req = new Request(url, { method, headers, body });
	const res = await fetch(req);

	return res;
}

/**
 * Generates and returns a random number between `min` and `max`.
 * @param {number} min The minimum value to generate.
 * @param {number} max The maximum value to generate.
 */
function random (min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Initializes mokepon cards and their attacks, as well as hiding non-relevant sections.
 */
async function startGame () {
	sectionChooseMokepon.style.display = "flex";
	sectionChooseAttack.style.display = "none";
	sectionMapView.style.display = "none";

	inputPlayerWin.checked = false;
	inputOpponentWin.checked = false;
	btnMokeponSelect.disabled = true;

	// Renders each mokepon selectable card.
	for (const mokepon of MOKEPONS) {
		mokeponCardsContainer.innerHTML += `
		<input type="radio" id="${mokepon.name.toLowerCase()}" name="mokepon" hidden />
		<label class="mokepon-card" for="${mokepon.name.toLowerCase()}">
			<p>${mokepon.name}</p>
			<img src="${mokepon.img.src}" alt="${mokepon.name}" />
		</label>
		`;
	}

	for (const mokepon of MOKEPONS) {
		const input = $(`#${mokepon.name.toLowerCase()}`);

		input.addEventListener("click", function () {
			btnMokeponSelect.disabled = false;

			if (this.checked)
				player.mokepon = mokepon.clone();
		});
	}

	try {
		await joinGame();

		btnMokeponSelect.addEventListener("click", () => {
			playerMokeponSelect(); 
		});
		btnRestart.addEventListener("click", () => {
			location.reload(); 
		});
		btnContinue.addEventListener("click", async () => {
			sectionChooseAttack.style.display = "none";

			const res = await f(`battle/${player.id}/end`);

			if (!res.ok)
				throw new Error("Something went wrong!");
			
			initializeMap();
		});
	}
	catch (err) {
		alert(err.message);
		console.error(err);
	}

}

/**
 * Tries to join the player to the multiplayer server.
 */
async function joinGame () {
	const res = await f("join");

	if (!res.ok)
		throw new Error("Something went wrong!");

	const data = await res.json();

	player = new Player(data.playerId);
}

/**
 * Logs the given `attack` to the corresponding entity.
 * @param {"player"|"opponent"} from Who started the attack.
 * @param {Attack} attack The attack that was used.
 */
function logAttack (from, attack) {
	const sectionLogger = $(`#${from}-attacks`);
	const p = document.createElement("p");

	p.textContent = (attack.icon + " " + attack.type.toUpperCase());

	sectionLogger.appendChild(p);
}

/**
 * This function is launched after the user selects a mokepon.
 */
async function playerMokeponSelect () {
	if (!player.mokepon) {
		alert("Please, pick a mokepon!");
		return;
	}

	sectionChooseMokepon.style.display = "none";

	const attacksContainer = $("#attacks-container");

	// Sets all the attack buttons based on the chosen mokepon.
	for (let i = 0; i < player.mokepon.attacks.length; i++) {
		const attack = player.mokepon.attacks[i];
		const attackButton = document.createElement("button");

		attackButton.textContent = `${attack.icon} ${attack.type}`;
		attackButton.addEventListener("click", (e) => {
			e.target.disabled = true;

			player.attacks.push(attack);

			logAttack("player", attack);

			if (player.attacks.length === 5)
				attackWith(player.attacks);
		});

		attacksContainer.appendChild(attackButton);
		attackButtons.push(attackButton);
	}

	try {
		// Sends the chosen mokepon to the server.
		const res = await f(`mokepon/${player.id}`, "post", {
			mokepon: player.mokepon.name
		});

		if (!res.ok)
			throw new Error("Something went wrong!");

		initializeMap();
	}
	catch (err) {
		alert(err.message);
		console.error(err);
	}
}

/**
 * Starts the battling sequence / Reset's battle section to defaults.
 * @param {Player} opponent The opponent's to battle against with.
 */
async function startBattle (opponent) {
	clearInterval(mapRefreshInterval);

	currentOpponent = opponent;

	inputPlayerWin.checked = false;
	inputOpponentWin.checked = false;

	btnRestart.style.display = "none";
	btnContinue.style.display = "none";

	for (const attackButton of attackButtons)
		attackButton.disabled = false;

	sectionChooseAttack.style.display = "flex";
	sectionMapView.style.display = "none";

	spanPlayerMokepon.innerHTML = player.mokepon.name;
	imgPlayerMokepon.src = player.mokepon.img.src;
	spanPlayerWins.innerHTML = "0";
	spanOpponentMokepon.innerHTML = opponent.mokepon.name;
	imgOpponentMokepon.src = opponent.mokepon.img.src;
	spanOpponentWins.innerHTML = "0";

	$("#player-attacks").innerHTML = "";
	$("#opponent-attacks").innerHTML = "";
	h3Result.textContent = "";

	// Let's the server know that the player has started a battle.
	const res = await f("battle/start", "post", {
		playerId: player.id,
		opponentId: opponent.id
	});

	if (!res.ok)
		throw new Error("Something went wrong!");
}

/**
 * Processes the attacks of the player and their opponent, counting each player's
 * win and giving the battle's result.
 */
function finishBattle () {
	clearInterval(battleFetchInterval);

	let playerWins = 0;
	let opponentWins = 0;

	// Compares each attack and adds a point to the players for each win.
	for (let i = 0; i < player.attacks.length; i++) {
		const playerAttack = player.attacks[i];
		const opponentAttack = currentOpponent.attacks[i];

		logAttack("opponent", opponentAttack);

		const result = (playerAttack.value - opponentAttack.value);

		// 🔥 > 🌵
		// 🌵 > 💧
		// 💧 > 🔥

		if (result === 1 || result < -1) 
			playerWins++;
		else if (result === -1 || result > 1) 
			opponentWins++;
	}

	spanPlayerWins.textContent = playerWins;
	spanOpponentWins.textContent = opponentWins;

	if (playerWins > opponentWins) {
		h3Result.textContent = "You win! 🎉";
		inputPlayerWin.checked = true;
	}
	else if (opponentWins > playerWins) {
		h3Result.textContent = "You lose! 💀";
		inputOpponentWin.checked = true;
	}
	else 
		h3Result.textContent = "It's a tie! 😐";
	

	currentOpponent = null;
	player.attacks = [];

	setTimeout(() => {
		btnContinue.style.display = "block";
	}, 1000);
}

/**
 * Attacks the opponent player with the given `attacks`.
 * @param {Attack[]} attacks The attacks that were selected by the player.
 */
async function attackWith (attacks) {
	const res = await f(`battle/${player.id}`, "post", { attacks });

	if (!res.ok)
		throw new Error("Something went wrong!");

	battleFetchInterval = setInterval(waitForOpponent, 250);
}

/**
 * This function is executed on an interval, checking to see if
 * the opponent has selected their attacks to proceed with the
 * results.
 */
async function waitForOpponent () {
	h3Result.textContent = "Waiting for opponent...";

	const res = await f(`battle/${currentOpponent.id}`);

	if (!res.ok)
		throw new Error("Something went wrong!");

	/** @type {{ attacks: Attack[] }} */
	const data = await res.json();

	const { attacks } = data;

	if (attacks.length !== 5)
		return;

	currentOpponent.attacks = attacks;

	finishBattle();
}

/**
 * Sets the map rendering and enables Keyboard control over it to move the mokepon.
 */
function initializeMap () {
	sectionMapView.style.display = "flex";

	mapRefreshInterval = setInterval(renderMap, 50);

	window.addEventListener("keydown", (ev) => {
		switch (ev.key.toLowerCase()) {
		case "w":
		case "arrowup":
			startMovingMokepon("up");
			break;
		case "s":
		case "arrowdown":
			startMovingMokepon("down");
			break;
		case "a":
		case "arrowleft":
			startMovingMokepon("left");
			break;
		case "d":
		case "arrowright":
			startMovingMokepon("right");
			break;
		default:
			break;
		}
	});

	window.addEventListener("keyup", () => {
		stopMovingMokepon(); 
	});
}

/**
 * This function is executed on an interval, refreshing the map
 * to update the player's location, as well as the opponents'.
 */
function renderMap () {
	const ctx = canvasMap.getContext("2d");
	const mapBg = new Image();

	mapBg.src = "/assets/mokemap.png";

	// Mokepon's speed is given by moving in the map, if there is
	// no speed, the mokepon won't move.
	player.mokepon.moveTo(
		player.mokepon.x + player.mokepon.speedX,
		player.mokepon.y + player.mokepon.speedY
	);

	ctx.clearRect(0, 0, canvasMap.width, canvasMap.height);
	ctx.drawImage(mapBg, 0, 0, canvasMap.width, canvasMap.height);
	
	// Checking if mokepon goes out of bounds.
	if (
		(player.mokepon.x < 0) ||
		(player.mokepon.x + player.mokepon.width > canvasMap.width) ||
		(player.mokepon.y < 0) ||
		(player.mokepon.y + player.mokepon.height > canvasMap.height)
	) {
		player.mokepon.moveTo(
			player.mokepon.x - player.mokepon.speedX,
			player.mokepon.y - player.mokepon.speedY
		);

		player.mokepon.stop();
	}
	
	player.mokepon.render();

	for (const opponent of opponents) {
		if (opponent.inBattle)
			continue;

		opponent.mokepon.render();

		// If the player collides with another player the battle sequence will begin.
		if (player.mokepon.isMoving() && hasCollisionWith(opponent.mokepon)) 
			startBattle(opponent);
	}

	f(`map/${player.id}`, "post", {
		x: player.mokepon.x,
		y: player.mokepon.y
	})
		.then((res) => {
			if (!res.ok)
				throw new Error("Something went wrong!");

			return res.json();
		})
		.then((data) => {
			/** @type {(Player & { x: number, y: number, opponent?: string })[]} */ 
			const opponentsData = data.opponents;
			const battlingOpponent = data.battling;

			// Updates the coordinates of every other player that is not already in battle.
			for (const opponent of opponentsData) {
				if (!opponent.mokepon)
					continue;
				
				// Find the opponent in the list of registered opponents.
				let registeredOpponent = opponents.find((opp) => (opp.id === opponent.id));

				// Checks if another player has entered a battle with the current player.
				//* This validation is required, as if one player is still in the map it
				//*  will not enter battle by checking collisions.
				if (registeredOpponent && battlingOpponent === registeredOpponent.id) 
					startBattle(registeredOpponent);

				// If the opponent wasn't found it will register them.
				// (with it's corresponding mokepon)
				if (!registeredOpponent) {
					registeredOpponent = new Player(opponent.id);

					switch (opponent.mokepon.name) {
					case "Hipodoge":
						registeredOpponent.setMokepon(hipodoge.clone());
						break;
					case "Capipepo":
						registeredOpponent.setMokepon(capipepo.clone());
						break;
					case "Ratigueya":
						registeredOpponent.setMokepon(ratigueya.clone());
						break;
					default:
						throw new Error("Opponent does not have a valid mokepon.");
					}

					opponents.push(registeredOpponent);
				}

				// Updating the coordinates of this player's mokepon.
				registeredOpponent.mokepon.moveTo(opponent.x, opponent.y);
				registeredOpponent.inBattle = opponent.opponent !== null;
			}
		})
		.catch((err) => {
			alert(err.message);
			console.error(err);
		});
}

/**
 * Makes validations to check if the player's mokepon is colliding with an
 * `entity`, stopping it's movement.
 * @param {MapEntity} entity The entity to check collision against with.
 */
function hasCollisionWith (entity) {
	const aboveEntity = entity.y;
	const belowEntity = entity.y + entity.height;
	const leftEntity = entity.x;
	const rightEntity = entity.x + entity.width;

	const abovePlayer = player.mokepon.y;
	const belowPlayer = player.mokepon.y + player.mokepon.height;
	const leftPlayer = player.mokepon.x;
	const rightPlayer = player.mokepon.x + player.mokepon.width;

	// If true, there is no collision with said entity.
	if (
		(belowPlayer < aboveEntity) ||
		(abovePlayer > belowEntity) ||
		(rightPlayer < leftEntity) ||
		(leftPlayer > rightEntity)
	)
		return false;

	// There is collision, moves the player to the last "safe" coordinates.
	player.mokepon.moveTo(
		player.mokepon.x - player.mokepon.speedX,
		player.mokepon.y - player.mokepon.speedY
	);

	player.mokepon.stop();

	return true;
}

/**
 * Moves the player's mokepon on the map in the specified `direction`.
 * @param {"up"|"down"|"left"|"right"} direction Where to move the mokepon.
 */
function startMovingMokepon (direction) {
	switch (direction) {
	case "up":
		player.mokepon.speedY = -MapEntity.SPEED_UNIT;
		break;
	case "down":
		player.mokepon.speedY = MapEntity.SPEED_UNIT;
		break;
	case "left":
		player.mokepon.speedX = -MapEntity.SPEED_UNIT;
		break;
	case "right":
		player.mokepon.speedX = MapEntity.SPEED_UNIT;
		break;
	default:
		stopMovingMokepon();
		break;
	}
}

/**
 * This function only exists so that it can be called from the HTML.
 */
function stopMovingMokepon () {
	player.mokepon.speedX = 0;
	player.mokepon.speedY = 0;
}

// #region CLASSES
/**
 * Represents an entity in the canvas map.
 */
class MapEntity {
	static SPEED_UNIT = 5;


	/**
	 * @param {string} iconSrc 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} height 
	 * @param {number} width 
	 */
	constructor (iconSrc, x, y, height, width) {
		this.icon = new Image();
		this.icon.src = iconSrc;
		this.x = x;
		this.y = y;
		this.height = height;
		this.width = width;
		this.speedX = 0;
		this.speedY = 0;
	}


	/**
	 * Renders the current entity in the map.
	 */
	render () {
		const ctx = canvasMap.getContext("2d");

		ctx.drawImage(this.icon, this.x, this.y, this.width, this.height);
	}

	/**
	 * Moves the entity to said coordinates.
	 * @param {number} x 
	 * @param {number} y 
	 */
	moveTo (x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	 * Stops the entity's movement speed.
	 */
	stop () {
		this.speedX = 0;
		this.speedY = 0;
	}

	/**
	 * Checks if the current entity has speed on any axis (equivalent of moving).
	 */
	isMoving () {
		return (this.speedX !== 0) || (this.speedY !== 0);
	}

	/**
	 * Returns a new instance based on the current entity.
	 */
	clone () {
		return new MapEntity(this.icon.src, this.x, this.y, this.height, this.width);
	}
}

/**
 * Represents a valid, playable mokepon.
 */
class Mokepon extends MapEntity {
	/**
	 * @param {string} name
	 * @param {Attack[]} attacks
	 */
	constructor (name, attacks) {
		super(
			`/assets/${name.toLowerCase()}-icon.png`,
			random(0, canvasMap.width - 24),
			random(0, canvasMap.height - 24),
			24,
			24
		);
		this.name = name;
		this.attacks = attacks;

		this.img = new Image();
		this.img.src = `/assets/${name.toLowerCase()}.png`;
	}

	/**
	 * Returns a new instance based on the current mokepon.
	 */
	clone () {
		return new Mokepon(this.name, [ ...this.attacks ]);
	}
}

/**
 * Represents a valid mokepon attack.
 */
class Attack {
	/**
	 * @param {string} type 
	 * @param {string} icon 
	 * @param {number} value
	 */
	constructor (type, icon, value) {
		this.type = type;
		this.icon = icon;
		this.value = value;
	}
}

/**
 * Represents a player in the multiplayer game.
 */
class Player {
	/**
	 * @param {string} id
	 */
	constructor (id) {
		this.id = id;

		this.mokepon = null;
		this.inBattle = false;
		this.attacks = [];
	}

	/**
	 * Sets the given `mokepon` as the selected mokepon by a player.
	 * @param {Mokepon} mokepon A valid mokepon.
	 */
	setMokepon (mokepon) {
		if (!(mokepon instanceof Mokepon))
			throw new Error("Provided mokepon is not valid.");

		this.mokepon = mokepon;
	}
}
// #endregion

(startGame)();
