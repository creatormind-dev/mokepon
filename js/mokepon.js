"use strict";

/** @type {typeof document.querySelector} */
const $ = document.querySelector.bind(document);


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

const fire = new Attack("fire", "🔥", 1);
const water = new Attack("water", "💧", 2);
const earth = new Attack("earth", "🌵", 3);


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


	render () {
		const ctx = canvasMap.getContext("2d");

		ctx.drawImage(this.icon, this.x, this.y, this.width, this.height);
	}

	/**
	 * @param {number} x 
	 * @param {number} y 
	 */
	moveTo (x, y) {
		this.x = x;
		this.y = y;
	}

	stop () {
		this.speedX = 0;
		this.speedY = 0;
	}

	isMoving () {
		return (this.speedX !== 0) || (this.speedY !== 0);
	}

	clone () {
		return new MapEntity(this.icon.src, this.x, this.y, this.height, this.width);
	}
}

class Mokepon extends MapEntity {
	/**
	 * @param {string} name
	 * @param {Attack[]} attacks
	 */
	constructor (name, attacks) {
		super(`/assets/${name.toLowerCase()}-icon.png`, 0, 0, 32, 32);
		this.name = name;
		this.attacks = attacks;

		this.img = new Image();
		this.img.src = `/assets/${name.toLowerCase()}.png`;
		this.wins = 0;
	}

	clone () {
		return new Mokepon(this.name, Array.from(this.attacks));
	}
}


const hipodoge = new Mokepon("Hipodoge", [ water, water, water, fire, earth ]);
const capipepo = new Mokepon("Capipepo", [ earth, earth, earth, fire, water ]);
const ratigueya = new Mokepon("Ratigueya", [ fire, fire, fire, water, earth ]);
// const langostelvis = new Mokepon("Langostelvis", [ fire, fire, water, water, earth ]);
// const tucapalma = new Mokepon("Tucapalma", [ earth, earth, water, water, fire ]);
// const pydos = new Mokepon("Pydos", [ fire, fire, earth, earth, water ]);

const MOKEPONS = [ hipodoge, capipepo, ratigueya, /* tucapalma, langostelvis, pydos */ ];


const NUM_OF_OPPONENTS = 3;

/** @type {Mokepon?} */
let player = null;
/** @type {Mokepon?} */
let currentOpponent = null;

/** @type {Mokepon[]} */
const opponents = [];

let mapRefreshInterval = null;


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
function startGame () {
	sectionChooseMokepon.style.display = "flex";
	sectionChooseAttack.style.display = "none";
	sectionMapView.style.display = "none";

	inputPlayerWin.checked = false;
	inputOpponentWin.checked = false;
	btnMokeponSelect.disabled = true;

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
				player = mokepon.clone();
		});
	}

	btnMokeponSelect.addEventListener("click", () => { playerMokeponSelect(); });
	btnRestart.addEventListener("click", () => { location.reload(); });
	btnContinue.addEventListener("click", () => {
		sectionChooseAttack.style.display = "none";
		
		initializeMap();
	});
}

/**
 * Ends the game, enabling the restart button and alerting the winner.
 * @param {"player"|"opponent"} winner Who won the battle.
 */
function finishGame (winner) {
	if (winner === "player") {
		alert("🎉 You won! 😃");

		opponents.splice(opponents.indexOf(currentOpponent), 1);
		currentOpponent = null;

		btnContinue.style.display = "block";
	}
	else if (winner === "opponent") {
		alert("💀 You lost! 😞");

		btnRestart.style.display = "block";
	}
	else {
		alert("💬 Nobody won, it's a Tie! 😐");

		btnContinue.style.display = "block";
	}
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

function playerMokeponSelect () {
	if (!player) {
		alert("Please, pick a pet!");
		return;
	}

	sectionChooseMokepon.style.display = "none";

	const attacksContainer = $("#attacks-container");

	for (let i = 0; i < player.attacks.length; i++) {
		const attack = player.attacks[i];
		const attackButton = document.createElement("button");

		attackButton.textContent = `${attack.icon} ${attack.type}`;
		attackButton.addEventListener("click", (e) => {
			e.target.disabled = true;

			attackWith(attack);
		});

		attacksContainer.appendChild(attackButton);
		attackButtons.push(attackButton);
	}

	opponentMokeponSelect();
	initializeMap();
}

function opponentMokeponSelect () {
	for (let i = 0; i < NUM_OF_OPPONENTS; i++) {
		const opponentPick = random(0, MOKEPONS.length - 1);

		opponents[i] = MOKEPONS[opponentPick].clone();
		opponents[i].x = random(0, canvasMap.width - opponents[i].width);
		opponents[i].y = random(0, canvasMap.height - opponents[i].height);
	}
}

/**
 * Starts the battling sequence.
 * @param {Mokepon} opponent The opponent's mokepon to battle against with.
 */
function startBattle (opponent) {
	clearInterval(mapRefreshInterval);

	player.wins = 0;
	opponent.wins = 0;

	opponent.attacks = MOKEPONS.find((mokepon) => mokepon.name === opponent.name).clone().attacks;

	inputPlayerWin.checked = false;
	inputOpponentWin.checked = false;

	btnRestart.style.display = "none";
	btnContinue.style.display = "none";

	for (const attackButton of attackButtons)
		attackButton.disabled = false;

	sectionChooseAttack.style.display = "flex";
	sectionMapView.style.display = "none";

	spanPlayerMokepon.innerHTML = player.name;
	imgPlayerMokepon.src = player.img.src;
	spanPlayerWins.innerHTML = player.wins;
	spanOpponentMokepon.innerHTML = opponent.name;
	imgOpponentMokepon.src = opponent.img.src;
	spanOpponentWins.innerHTML = opponent.wins;

	$("#player-attacks").innerHTML = "";
	$("#opponent-attacks").innerHTML = "";
	h3Result.textContent = "";

	currentOpponent = opponent;
}

/**
 * Attacks with the given type of attack.
 * @param {Attack} attack The type of attack used in combat.
 */
function attackWith (attack) {
	const playerAttack = attack;

	logAttack("player", playerAttack);

	const opponentAttackIndex = random(0, currentOpponent.attacks.length - 1);
	const opponentAttack = currentOpponent.attacks.splice(opponentAttackIndex, 1)[0];

	logAttack("opponent", opponentAttack);

	const result = (playerAttack.value - opponentAttack.value);

	if (result == 1 || result < -1) {
		h3Result.textContent = "You Win! 🎉";
		player.wins++;
	}
	else if (result == -1 || result > 1) {
		h3Result.textContent = "You Lose! 💀";
		currentOpponent.wins++;
	}
	else if (result === 0)
		h3Result.textContent = "Tie! 😐";

	spanPlayerWins.textContent = player.wins;
	spanOpponentWins.textContent = currentOpponent.wins;


	if ((player.wins === 5 || currentOpponent.wins === 5) || currentOpponent.attacks.length === 0) {
		if (player.wins > currentOpponent.wins) {
			inputPlayerWin.checked = true;
			h3Result.textContent = "You Win! 🎉";
			finishGame("player");
		}
		else if (currentOpponent.wins > player.wins) {
			inputOpponentWin.checked = true;
			h3Result.textContent = "You Lose! 💀";
			finishGame("opponent");
		}
		else {
			h3Result.textContent = "Tie! 😐";
			finishGame();
		}
	}
}

function initializeMap () {
	sectionMapView.style.display = "flex";

	if (opponents.length === 0) {
		setTimeout(() => {
			alert("🎉 You defeated all the mokepons in the area, congratulations! 😃\nThe game will now restart")
			location.reload();
		}, 1000);
	}

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
		}
	});

	window.addEventListener("keyup", () => { stopMovingMokepon(); });
}

function renderMap () {
	const ctx = canvasMap.getContext("2d");
	const mapBg = new Image();

	mapBg.src = "/assets/mokemap.png";

	player.moveTo(player.x + player.speedX, player.y + player.speedY);

	ctx.clearRect(0, 0, canvasMap.width, canvasMap.height);
	ctx.drawImage(mapBg, 0, 0, canvasMap.width, canvasMap.height);
	
	player.render();
	
	for (const opponent of opponents)
		opponent.render();

	if (player.isMoving()) {
		for (const opponent of opponents)
			checkCollisionWith(opponent);
	}
}

/**
 * @param {MapEntity} entity 
 */
function checkCollisionWith (entity) {
	const aboveEntity = entity.y;
	const belowEntity = entity.y + entity.height;
	const leftEntity = entity.x;
	const rightEntity = entity.x + entity.width;

	const abovePlayer = player.y;
	const belowPlayer = player.y + player.height;
	const leftPlayer = player.x;
	const rightPlayer = player.x + player.width;

	if (
		belowPlayer < aboveEntity ||
		abovePlayer > belowEntity ||
		rightPlayer < leftEntity ||
		leftPlayer > rightEntity
	)
		return;

	player.moveTo(player.x - player.speedX, player.y - player.speedY);
	player.stop();

	if (entity instanceof Mokepon)
		startBattle(entity);
}

/**
 * Moves the player's mokepon on the map in the specified `direction`.
 * @param {"up"|"down"|"left"|"right"} direction Where to move the mokepon.
 */
function startMovingMokepon (direction) {
	switch (direction) {
	case "up":
		player.speedY = -MapEntity.SPEED_UNIT;
		break;
	case "down":
		player.speedY = MapEntity.SPEED_UNIT;
		break;
	case "left":
		player.speedX = -MapEntity.SPEED_UNIT;
		break;
	case "right":
		player.speedX = MapEntity.SPEED_UNIT;
		break;
	}
}

function stopMovingMokepon () {
	player.speedX = 0;
	player.speedY = 0;
}


(startGame)();
