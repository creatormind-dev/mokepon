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

const chkPlayerWin = $("#player-win");
const chkOpponentWin = $("#opponent-win");
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
 * Displays the given `message` in the side panel.
 * @param {string} message The message to display.
 * @param {boolean} separator Whether or not to append a separator at the end of the message.
 */
function announce (message, separator = false) {
	const sectionMessages = $("#messages");
	const p = document.createElement("p");

	p.textContent = message;

	sectionMessages.appendChild(p);

	if (separator)
		sectionMessages.appendChild(document.createElement("hr"));
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

function playerPetSelect () {
	const inputHipodoge = $("#hipodoge");
	const inputCapipepo = $("#capipepo");
	const inputRatigueya = $("#ratigueya");
	const inputTucapalma = $("#tucapalma");
	const inputLangostelvis = $("#langostelvis");
	const inputPydos = $("#pydos");

	if (inputHipodoge.checked)
		playerPet = { ...MOKEPONS[0] };
	else if (inputCapipepo.checked)
		playerPet = { ...MOKEPONS[1] };
	else if (inputRatigueya.checked)
		playerPet = { ...MOKEPONS[2] };
	else if (inputTucapalma.checked)
		playerPet = { ...MOKEPONS[3] };
	else if (inputLangostelvis.checked)
		playerPet = { ...MOKEPONS[4] };
	else if (inputPydos.checked)
		playerPet = { ...MOKEPONS[5] };
	else {
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
		const att = playerPet.attacks[i];
		const attackButton = document.createElement("button");

		console.log(att);

		attackButton.textContent = `${att.icon} ${att.type}`;
		attackButton.addEventListener("click", (e) => {
			e.target.disabled = true;

			attack(i);
		});

		attacksContainer.appendChild(attackButton);
	}

	opponentPetSelect();
}

function opponentPetSelect () {
	const opponentPick = random(0, MOKEPONS.length - 1);

	opponentPet = { ...MOKEPONS[opponentPick] };

	$("#opponent-pet").innerHTML = opponentPet.name;
	$("#opponent-pet-img").src = opponentPet.img;
	$("#opponent-wins").innerHTML = opponentPet.wins;
}

/**
 * Attacks with the given type of attack.
 * @param {number} attackIndex The type of attack used in combat.
 */
function attack (attackIndex) {
	const playerAttack = playerPet.attacks[attackIndex];

	announce("> Your pet attacked with " + playerAttack.type.toUpperCase() + "!");
	logAttack("player", playerAttack);

	const opponentAttackIndex = random(0, opponentPet.attacks.length - 1);
	const opponentAttack = opponentPet.attacks.splice(opponentAttackIndex, 1)[0];

	announce("> Opponent's pet attacked with " + opponentAttack.type.toUpperCase() + "!");
	logAttack("opponent", opponentAttack);

	const h3Result = $("#result");
	const result = (playerAttack.value - opponentAttack.value);

	if (result == 1 || result < -1) {
		announce("You Win! 🎉", true);
		h3Result.textContent = "You Win! 🎉";
		playerPet.wins++;
	}
	else if (result == -1 || result > 1) {
		announce("You Lose! 💀", true);
		h3Result.textContent = "You Lose! 💀";
		opponentPet.wins++;
	}
	else if (result === 0) {
		announce("Tie! 😐", true);
		h3Result.textContent = "Tie! 😐";
	}

	$("#player-wins").textContent = playerPet.wins;
	$("#opponent-wins").textContent = opponentPet.wins;


	if ((playerPet.wins === 5 || opponentPet.wins === 5) || opponentPet.attacks.length === 0) {
		if (playerPet.wins > opponentPet.wins) {
			chkPlayerWin.checked = true;
			h3Result.textContent = "You Win! 🎉";
			finishGame();
		}
		else if (opponentPet.wins > playerPet.wins) {
			chkOpponentWin.checked = true;
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
	$("#messages").innerHTML = "";

	chkPlayerWin.checked = false;
	chkOpponentWin.checked = false;

	for (const mokepon of MOKEPONS) {
		petCards.innerHTML += `
		<input type="radio" name="pet" id="${mokepon.name.toLowerCase()}" hidden />
		<label class="pet-card" for="${mokepon.name.toLowerCase()}">
			<p>${mokepon.name}</p>
			<img src="${mokepon.img}" alt="${mokepon.icon}" />
		</label>
		`;
	}

	btnPet.addEventListener("click", () => { playerPetSelect(); });
	btnRestart.addEventListener("click", () => { location.reload(); });
}

function finishGame () {
	btnRestart.style.display = "block";
}


(startGame)();
