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


class Mokepon {
	/**
	 * @param {string} name 
	 * @param {string} icon 
	 * @param {Attack[]} attacks
	 * @param {string} img 
	 */
	constructor (name, icon, attacks, img) {
		this.name = name;
		this.icon = icon;
		this.img = img;
		this.attacks = attacks;
		this.wins = 0;
	}
}


const hipodoge = new Mokepon("Hipodoge", "🐶", [ water, water, water, fire, earth ], "/assets/mokepons_mokepon_hipodoge_attack.png");
const capipepo = new Mokepon("Capipepo", "🐛", [ earth, earth, earth, fire, water ], "/assets/mokepons_mokepon_capipepo_attack.png");
const ratigueya = new Mokepon("Ratigueya", "🐀", [ fire, fire, fire, water, earth ], "/assets/mokepons_mokepon_ratigueya_attack.png");
const langostelvis = new Mokepon("Langostelvis", "🦞", [ fire, fire, water, water, earth ], "/assets/mokepons_mokepon_langostelvis_attack.png");
const tucapalma = new Mokepon("Tucapalma", "🦜", [ earth, earth, water, water, fire ], "/assets/mokepons_mokepon_tucapalma_attack.png");
const pydos = new Mokepon("Pydos", "🐍", [ fire, fire, earth, earth, water ], "/assets/mokepons_mokepon_pydos_attack.png");

const MOKEPONS = [ hipodoge, capipepo, ratigueya, tucapalma, langostelvis, pydos ];


/** @type {Mokepon?} */
let playerPet = null;
/** @type {Mokepon?} */
let opponentPet = null;


// #region HTML_VARIABLES
const btnPet = $("#pet-pick");
const btnRestart = $("#restart-game");

const inputPlayerWin = $("#player-win");
const inputOpponentWin = $("#opponent-win");
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
	if (!playerPet) {
		alert("Please, pick a pet!");
		return;
	}

	$("#player-pet").innerHTML = playerPet.name;
	$("#player-pet-img").src = playerPet.img;
	$("#player-wins").innerHTML = playerPet.wins;
	$("#choose-pet").style.display = "none";
	$("#choose-attack").style.display = "flex";

	const attacksContainer = $("#attacks-container");

	for (let i = 0; i < playerPet.attacks.length; i++) {
		const attack = playerPet.attacks[i];
		const attackButton = document.createElement("button");
		const index = i;

		attackButton.textContent = `${attack.icon} ${attack.type}`;
		attackButton.addEventListener("click", (e) => {
			e.target.disabled = true;

			makeAttack(attack);
		});

		attacksContainer.appendChild(attackButton);
	}

	opponentMokeponSelect();
}

function opponentMokeponSelect () {
	const opponentPick = random(0, MOKEPONS.length - 1);

	opponentPet = { ...MOKEPONS[opponentPick] };

	$("#opponent-pet").innerHTML = opponentPet.name;
	$("#opponent-pet-img").src = opponentPet.img;
	$("#opponent-wins").innerHTML = opponentPet.wins;
}

/**
 * Attacks with the given type of attack.
 * @param {Attack} attack The type of attack used in combat.
 */
function makeAttack (attack) {
	const playerAttack = attack;

	logAttack("player", playerAttack);

	const opponentAttackIndex = random(0, opponentPet.attacks.length - 1);
	const opponentAttack = opponentPet.attacks.splice(opponentAttackIndex, 1)[0];

	logAttack("opponent", opponentAttack);

	const h3Result = $("#result");
	const result = (playerAttack.value - opponentAttack.value);

	if (result == 1 || result < -1) {
		h3Result.textContent = "You Win! 🎉";
		playerPet.wins++;
	}
	else if (result == -1 || result > 1) {
		h3Result.textContent = "You Lose! 💀";
		opponentPet.wins++;
	}
	else if (result === 0)
		h3Result.textContent = "Tie! 😐";

	$("#player-wins").textContent = playerPet.wins;
	$("#opponent-wins").textContent = opponentPet.wins;


	if ((playerPet.wins === 5 || opponentPet.wins === 5) || opponentPet.attacks.length === 0) {
		if (playerPet.wins > opponentPet.wins) {
			inputPlayerWin.checked = true;
			h3Result.textContent = "You Win! 🎉";
			finishGame();
		}
		else if (opponentPet.wins > playerPet.wins) {
			inputOpponentWin.checked = true;
			h3Result.textContent = "You Lose! 💀";
			finishGame();
		}
		else {
			h3Result.textContent = "Tie! 😐";
			finishGame();
		}
	}
}

function startGame () {
	const petCards = $("#pet-cards");
	
	$("#choose-pet").style.display = "flex";
	$("#choose-attack").style.display = "none";

	inputPlayerWin.checked = false;
	inputOpponentWin.checked = false;
	btnPet.disabled = true;

	for (let i = 0; i < MOKEPONS.length; i++) {
		const mokepon = MOKEPONS[i];

		petCards.innerHTML += `
		<input type="radio" id="${mokepon.name.toLowerCase()}" name="mokepon" hidden />
		<label class="pet-card" for="${mokepon.name.toLowerCase()}">
			<p>${mokepon.name}</p>
			<img src="${mokepon.img}" alt="${mokepon.icon}" />
		</label>
		`;
	}

	for (let i = 0; i < MOKEPONS.length; i++) {
		const input = $(`#${MOKEPONS[i].name.toLowerCase()}`);

		input.addEventListener("click", function () {
			btnPet.disabled = false;

			if (this.checked)
				playerPet = { ...MOKEPONS[i] };
		});
	}

	btnPet.addEventListener("click", () => { playerMokeponSelect(); });
	btnRestart.addEventListener("click", () => { location.reload(); });
}

function finishGame () {
	btnRestart.style.display = "block";
}


(startGame)();
