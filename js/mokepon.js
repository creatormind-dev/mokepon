"use strict";

/** @type {typeof document.querySelector} */
const $ = document.querySelector.bind(document);


class Attack {
	/**
	 * @param {string} type 
	 * @param {string} icon 
	 */
	constructor (type, icon) {
		this.type = type;
		this.icon = icon;
	}
}

const ATTACKS = [
	new Attack("fire", "🔥"),
	new Attack("water", "💧"),
	new Attack("earth", "🌵"),
];


class Mokepon {
	/**
	 * @param {string} name 
	 * @param {string} icon 
	 * @param {number} hp 
	 * @param {string} img 
	 */
	constructor (name, icon, hp, img) {
		this.name = name;
		this.icon = icon;
		this.hp = hp;
		this.img = img;
	}
}


const hipodoge = new Mokepon("Hipodoge", "🐶", 5, "/assets/mokepons_mokepon_hipodoge_attack.png");
const capipepo = new Mokepon("Capipepo", "🐛", 5, "/assets/mokepons_mokepon_capipepo_attack.png");
const ratigueya = new Mokepon("Ratigueya", "🐀", 5, "/assets/mokepons_mokepon_ratigueya_attack.png");

const MOKEPONS = [ hipodoge, capipepo, ratigueya ];


/** @type {Mokepon?} */
let playerPet = null;
/** @type {Mokepon?} */
let opponentPet = null;


// #region HTML_VARIABLES
const btnPet = $("#pet-pick");
const btnRestart = $("#restart-game");
const btnAttackFire = $("#attack-pick-fire");
const btnAttackWater = $("#attack-pick-water");
const btnAttackEarth = $("#attack-pick-earth");

const chkPlayerWin = $("#player-win");
const chkOpponentWin = $("#opponent-win");

const attackButtons = [ btnAttackFire, btnAttackWater, btnAttackEarth ];
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

function playerSelectPet () {
	const inputHipodoge = $("#hipodoge");
	const inputCapipepo = $("#capipepo");
	const inputRatigueya = $("#ratigueya");

	if (inputHipodoge.checked)
		playerPet = { ...MOKEPONS[0] };
	else if (inputCapipepo.checked)
		playerPet = { ...MOKEPONS[1] };
	else if (inputRatigueya.checked)
		playerPet = { ...MOKEPONS[2] };
	else {
		alert("Please, pick a pet!");
		return;
	}

	$("#player-pet").innerHTML = playerPet.name;
	$("#player-pet-img").src = playerPet.img;
	$("#player-life").innerHTML = playerPet.hp;
	$("#choose-pet").style.display = "none";
	$("#choose-attack").style.display = "flex";

	opponentSelectPet();
}

function opponentSelectPet () {
	const opponentPick = random(0, MOKEPONS.length - 1);

	opponentPet = { ...MOKEPONS[opponentPick] };

	$("#opponent-pet").innerHTML = opponentPet.name;
	$("#opponent-pet-img").src = opponentPet.img;
	$("#opponent-life").innerHTML = opponentPet.hp;
}

/**
 * Attacks with the given type of attack.
 * @param {string} type The type of attack used in combat.
 */
function attack (type) {
	const attackIndex = ATTACKS.findIndex((att) => (att.type === type));
	const playerAttack = ATTACKS[attackIndex];

	if (!playerAttack) {
		alert("Invalid type of attack!");
		return;
	}

	announce("> Your pet attacked with " + playerAttack.type.toUpperCase() + "!");
	logAttack("player", playerAttack);

	const pick = random(0, ATTACKS.length - 1);
	const opponentAttack = ATTACKS[pick];

	announce("> Opponent's pet attacked with " + opponentAttack.type.toUpperCase() + "!");
	logAttack("opponent", opponentAttack);

	const h3Result = $("#result");
	const result = (attackIndex - pick);

	if (result == 1 || result < -1) {
		announce("You Win! 🎉", true);
		h3Result.textContent = "You Win! 🎉";
		opponentPet.hp--;
	}
	else if (result == -1 || result > 1) {
		announce("You Lose! 💀", true);
		h3Result.textContent = "You Lose! 💀";
		playerPet.hp--;
	}
	else if (result === 0) {
		announce("Tie! 😐", true);
		h3Result.textContent = "Tie! 😐";
	}

	$("#player-life").textContent = playerPet.hp;
	$("#opponent-life").textContent = opponentPet.hp;

	if (playerPet.hp === 0) {
		chkOpponentWin.checked = true;
		alert("Your pet doesn't have more lives. Game over.");
		finishGame();
	}
	else if (opponentPet.hp === 0) {
		chkPlayerWin.checked = true;
		alert("Opponent's pet doesn't have more lives. You win!");
		finishGame();
	}
}

function startGame () {
	const petCards = $("#pet-cards");
	
	$("#choose-pet").style.display = "flex";
	$("#choose-attack").style.display = "none";
	$("#messages").innerHTML = "";

	chkPlayerWin.checked = false;
	chkOpponentWin.checked = false;

	attackButtons.forEach((btn) => { btn.disabled = false; });

	for (const mokepon of MOKEPONS) {
		petCards.innerHTML += `
		<input type="radio" name="pet" id="${mokepon.name.toLowerCase()}" hidden />
		<label class="pet-card" for="${mokepon.name.toLowerCase()}">
			<p>${mokepon.name}</p>
			<img src="${mokepon.img}" alt="${mokepon.icon}" />
		</label>
		`;
	}

	btnPet.addEventListener("click", () => { playerSelectPet(); });
	btnRestart.addEventListener("click", () => { location.reload(); });
	btnAttackFire.addEventListener("click", () => { attack("fire"); });
	btnAttackWater.addEventListener("click", () => { attack("water"); });
	btnAttackEarth.addEventListener("click", () => { attack("earth"); });
}

function finishGame () {
	attackButtons.forEach((btn) => { btn.disabled = true; });
	btnRestart.style.display = "block";
}


(startGame)();
