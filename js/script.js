// { "pseudo" : "pseudonyme", "identifiant" : "code", "etat" : "OK" }

const urlAPI = "https://trankillprojets.fr/P4/?";

const phraseReconnexion = "Reconnexion : ";
const phraseConnecte = "Connecté en tant que ";

const colorJ1 = "#ff3333";
const colorJ2 = "#d8cc00";

const etat = Object.freeze({
    KO: "KO", // votre compte n'est pas reconnu par le serveur
    OK: "OK", // votre compte est reconnu par le serveur
    ENATTENTE: "En attente",// Il n'y a pas encore d'adversaire
    ATTENTESUPPRIMEE: "Attente supprimee",  // Attente d'adversaire supérieure à 2 minutes, suppression de la partie
    ENCOURS: "En cours", // Une partie est en cours
    ABANDON: "Abandon", // Abandon de votre phase d'attente
    J1GAGNE: "joueur 1 gagne", // Le joueur numéro 1 gagne
    J2GAGNE: "joueur 2 gagne", // Le joueur numéro 2 gagne
    MATCHNUL: "Match nul" // Aucun des joueurs ne remporte la partie
});

let monTour = false;
let gameEnd = false;

const nbPions = 20;

async function Inscription() {
    const pseudoInput = document.getElementById("pseudo");
    const message = document.getElementById("message");

    console.log(pseudoInput.value);

    if (localStorage.getItem("pseudo") != pseudoInput.value) {
        const apicall = await fetch(urlAPI + "inscription&pseudo=" + pseudoInput.value);
        const reponse = await apicall.json();

        console.log("Inscription : ", reponse);

        if (reponse.etat == etat.KO) {
            message.textContent = "Pseudo déjà pris";
            message.style.animation = "bounce-top 0.9s both";
            pseudoInput.style.animation = "shake-horizontal 0.8s cubic-bezier(0.455, 0.030, 0.515, 0.955) both";
            return; // Sortie de la fonction
        }
        else if (reponse.etat == etat.OK) {
            console.log("Enregistrement du pseudo {" + pseudoInput.value + "} et de l'Id {" + reponse.identifiant + "}");
            localStorage.setItem("pseudo", pseudoInput.value);
            localStorage.setItem("id", reponse.identifiant);
        }
    }
    MenuTransition();
    // window.location.replace("menu.html");
}

// Reconnexion avec un pseudo précédemment enregistré
function Reconnexion() {
    MenuTransition();
    // window.location.replace("menu.html");
    console.log("Reconnexion");
    console.log("Pseudo : " + localStorage.getItem("pseudo"));
    console.log("Identifiant : " + localStorage.getItem("id"));
}

function showWhoIsConnected() {
    // Récup le pseudo
    const pseudo = localStorage.getItem("pseudo");

    console.log("Pseudo : " + pseudo);
    console.log("Identifiant : " + localStorage.getItem("id"));

    // Affiche qui est connecté
    document.getElementById("connected").textContent = phraseConnecte + pseudo;
}

// Retour à l'inscription
function Quitter() {
    const etatSearch = document.getElementById("etat");
    const pseudoAdversaire = document.getElementById("j2");
    if ((etatSearch != null && etatSearch.textContent != "") || (pseudoAdversaire != null && pseudoAdversaire.textContent != "")) {
        // document.getElementById("videoWin").style.display = "none";
        // document.getElementById("videoRagequit").style.display = "none";
        // document.getElementById("videoLoose").style.display = "none";
        // Demande un abandon de la recherche uniquement si elle à été lancée
        Giveup();
    }

    console.log("Quitter");
    window.location.replace("index.html");
}

async function Participer(forceReload) {
    // Lancer la partie
    if (forceReload || document.getElementById('musicAttente') == null) {
        const id = localStorage.getItem("id");
        const apicall = await fetch(urlAPI + "participer&identifiant=" + id);
        const reponse = await apicall.json();

        console.log("Participer : ", reponse);

        const etatSearch = document.getElementById("etat");

        if (reponse.etat == etat.ENATTENTE) {
            etatSearch.textContent = "Recherche d'aversaire...";
            etatSearch.style.animation = "rotate-hor-center 1.5s cubic-bezier(0.455, 0.030, 0.515, 0.955) 0.5s infinite both";
            // Musique d'attente
            if (document.getElementById('musicAttente') == null) {
                createAudio("musicAttente", "Local Forecast - Elevator.mp3", 1);
                // Animation de chilling
                document.getElementById("videoChill").style.display = "block";
                document.getElementById("videoChill").scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
            // Recherche de partie
            WaitingGame();
        }
        else if (reponse.etat == etat.ENCOURS) {
            localStorage.setItem("joueur", parseInt(reponse.joueur));
            window.location.replace("jeu.html");
        }
    }
}

// Rafraîchit les informations de la partie
async function refresh() {

    if (gameEnd) {
        return;
    }

    const Id = localStorage.getItem("id");
    const pseudo = localStorage.getItem("pseudo");
    const joueurIndex = localStorage.getItem("joueur");

    const apicall = await fetch(urlAPI + "statut&identifiant=" + Id);
    const reponse = await apicall.json();
    console.log("Statut (Playing) : ", reponse);

    const h2J1 = document.getElementById('j1');
    const h2J2 = document.getElementById('j2');

    if (reponse.carte != undefined) {
        updatePlateau(reponse.carte);
    }

    if (reponse.etat == etat.ENCOURS) {
        if (reponse.adversaire == null) {
            console.log("partie crash");
            Quitter();
        }

        monTour = (joueurIndex == reponse.tour);
        h2J1.textContent = joueurIndex == 1 ? pseudo : reponse.adversaire;
        h2J2.textContent = joueurIndex == 2 ? pseudo : reponse.adversaire;

        if (reponse.tour == "1") {
            h2J1.style.animation = "text-pop-up-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both, pseudo-pulse 2s infinite";
            h2J2.style.animation = "";
        }
        else {
            h2J1.style.animation = "";
            h2J2.style.animation = "text-pop-up-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both, pseudo-pulse 2s infinite";
        }

    }
    else if (reponse.etat.includes("gagne")) {
        if (reponse.etat.includes(joueurIndex)) {
            GameEnd(null);
        }
        else {
            GameEnd(false);
        }
    }
    else if (reponse.etat == etat.OK) {
        MenuTransition();
        // window.location.replace("menu.html");
    }
    else if (reponse.etat == etat.MATCHNUL)
    {
        MatchNul();
    }
    else {
        alert('crash server');
    }
}

function updatePlateau(carte) {
    // met à jour le plateau avec la nouvelle carte
    for (let ligne = 0; ligne < 6; ligne++) {
        for (let col = 0; col < 7; col++) {
            const cellIndex = ligne * 7 + col + 1;
            const caseValue = carte[ligne][col];

            const cellule = document.getElementById(cellIndex);

            // AJOUT DE NOUVEAU PION
            if (cellule.innerHTML == "" && caseValue > 0) {
                const portepion = document.createElement("div");
                const pion = document.createElement("div");

                // Ajout CSS pour le fond du pion
                portepion.classList.add("portePion");
                portepion.classList.add("J" + caseValue);
                // Ajout CSS pour le coeur du pion
                pion.classList.add("game-pion");
                pion.classList.add("J" + caseValue);

                // Calcul de la distance entre le haut du plateau et la position finale du NOUVEAU pion
                const distance = "-" + ligne + 1 * cellule.offsetHeight + "px";
                document.documentElement.style.setProperty("--distance", distance);
                // Ajout de l'animation
                portepion.style.animation = "pionFall 0.5s cubic-bezier(.42,-0.08,1,1) both";
                createAudio("pion", "pion sound effect.mp3", 1, false);
                const pionSound = document.getElementById("pion");
                pionSound.addEventListener("ended", () => {document.body.removeChild(pionSound);});

                // Animation de rebond
                portepion.addEventListener("animationend", () => {
                    if (!portepion.style.animation.includes("bounce-pion")) {
                        portepion.style.animation += ", bounce-pion 0.9s both";
                    }
                });

                // Ajout du pion à la case correspondante
                portepion.appendChild(pion);
                cellule.appendChild(portepion);
            }
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function addInteractions() {
    const animation = "cell-pulse-J" + localStorage.getItem("joueur") + " 1s ease-in-out 0s infinite";

    for (var i = 1; i <= 42; i++) {
        let colonne = (i % 7 == 0) ? 7 : i % 7;
        let td = document.getElementById(i);
        td.addEventListener("click", () => {
            Jouer(colonne);
        });

        td.addEventListener('mouseover', () => {
            const havePion = (td.innerHTML.includes("pion"));
            if (monTour && !havePion) {
                // Possibilité de jouer
                td.style.animation = animation;
                td.style.cursor = "cell";
            }
            else if (!monTour && !havePion) {
                // Attente de son tour
                td.style.animation = "";
                td.style.cursor = "wait";
            }
            else {
                // Case remplie
                td.style.animation = "";
                td.style.cursor = "no-drop";
            }
        });
        td.addEventListener('mouseleave', () => {
            // Souris plus là
            td.style.animation = "";
        });
    }
}

async function Jouer(colonne) {
    if (!monTour) {
        return;
    }
    const id = localStorage.getItem("id");
    const joueurIndex = localStorage.getItem("joueur");

    const apicall = await fetch(urlAPI + "jouer&position=" + colonne + "&identifiant=" + id);
    const reponse = await apicall.json();

    console.log("Jouer(" + colonne + ") : ", reponse);
    // A CORRIGER
    if (reponse.tour != null) {
        monTour = (joueurIndex == reponse.tour);
    }

    updatePlateau(reponse.carte);

    if (reponse.etat.includes("gagne")) {
        GameEnd(reponse.etat.includes(joueurIndex));
    }
}

async function MatchNul() {
    await showModal("Match nul", 2000, "blue", "blue");
    document.getElementById("state").style.marginBottom = "1em";
}

async function GameEnd(IamWinner) {
    console.log("GameEnd(" + IamWinner + ") : ", IamWinner);
    gameEnd = true;

    if (IamWinner != null) {
        if (IamWinner) {
            await showModal("Victoire !", 2000, "green", "white");
            // Animation de victoire
            document.getElementById("videoWin").style.display = "block";
            // Musique de victoire
            createAudio("musicVictoire", "Driftveil City [Pokémon Black & White].mp3", 0.3);
        }
        else {
            await showModal("Défaite", 2000, "red", "darkred");
            // Animation de défaite
            document.getElementById("videoLoose").play();
            document.getElementById("videoLoose").style.display = "block";
            // Musique de défaite
            // createAudio("musicLoose", "Yoshi's Island OST - Flower Garden.mp3", 0.5);
        }
    }
    else {
        // Animation de ragequit
        document.getElementById("videoRagequit").style.display = "block";
        // Musique de victoire
        createAudio("musicVictoire", "Driftveil City [Pokémon Black & White].mp3", 0.3);
        await showModal("Il/Elle a RageQuit...", 0, "black", "black");
    }
}


async function showModal(message, wait, color, bgcolor) {
    var modal = document.getElementById("myModal");
    var stateText = document.getElementById("state");

    document.documentElement.style.setProperty("--modal-color", bgcolor);

    stateText.textContent = message;
    stateText.style.color = color;

    if (wait != undefined) {
        await sleep(wait);
    }

    modal.style.display = "block";
}

function createAudio(id, title, volume, loop) {
    const music = document.createElement("audio");
    music.id = id;
    music.src = "musics/" + title;
    music.loop = loop!=null?loop:true;
    music.volume = volume;
    document.body.appendChild(music);
    music.play();
}

// Recherche de game après la participation
async function WaitingGame() {
    const id = localStorage.getItem("id");
    let apicall;
    let reponse;
    const etatSearch = document.getElementById("etat");

    do {
        apicall = await fetch(urlAPI + "statut&identifiant=" + id);
        reponse = await apicall.json();
        console.log("Statut (Search Game) : ", reponse);

        if (reponse.etat == etat.ATTENTESUPPRIMEE) {
            etatSearch.textContent = "Relance en cours";
            etatSearch.style.animation = "shake-horizontal 0.8s cubic-bezier(0.455, 0.030, 0.515, 0.955) both";

            for (let index = 0; index < 3; index++) {
                etatSearch.textContent += ".";
                await sleep(1000);
            }

            // Relance la recherche comme elle a été supprimée
            Participer(true);
            return;
        }
        // Délai entre chaque tentative de lecture du statut
        await sleep(3000);

    } while (reponse.etat == etat.ENATTENTE)

    localStorage.setItem("joueur", parseInt(reponse.joueur));
    document.getElementById("videoChill").style.display = "none";
    window.location.replace("jeu.html");
}

async function Giveup() {
    // Abadonner la partie
    let id = localStorage.getItem("id");
    const apicall = await fetch(urlAPI + "abandonner&identifiant=" + id);
    const reponse = await apicall.json();
    console.log("Abandon : ", reponse);

    if (reponse.etat.includes("gagne")) {
        // Vous avez abandonné votre partie !
        MenuTransition();
        // window.location.replace("menu.html");
    }
    else if (reponse.etat == etat.KO) {
        console.log("personne dans la partie");
        MenuTransition();
        // window.location.replace("menu.html");
    }
    else if (reponse.etat == "Abandon") {
        console.log("Abandon de la recherche");
    }
}

function OLDcreatePions() {
    for (let index = 0; index < nbPions; index++) {
        const div = document.createElement("div");
        const imgPion = document.createElement("img");

        if (index % 2 == 0) {
            imgPion.src = "images/pion orange.png";
        } else {
            imgPion.src = "images/pion rouge.png";
        }
        div.id = index;
        div.appendChild(imgPion);
        div.classList.add('pion');
        xCoord = Math.floor((Math.random() * nbPions)) * (100 / nbPions);

        div.style.left = xCoord + "vw";
        div.style.animation = "pion-vertical 4s linear infinite";
        div.style.animationDuration = 4 + Math.floor((Math.random() * 10)) + 's';
        div.addEventListener("animationiteration", () => { replacePion(div); });

        document.getElementById("background").appendChild(div);

    }
}

function CreateAnimatedBackground() {
    for (let index = 0; index < nbPions; index++) {
        const portepion = document.createElement("div");
        const pion = document.createElement("div");

        let pionColor = (index % 2 == 0) ? 1 : 2

        portepion.classList.add("portePion"); portepion.classList.add("J" + pionColor);
        pion.classList.add("game-pion"); pion.classList.add("J" + pionColor);

        portepion.id = index;
        portepion.appendChild(pion);
        portepion.classList.add('pion');
        portepion.style.width = "60px";
        portepion.style.height = "60px";

        xCoord = Math.floor((Math.random() * nbPions)) * (100 / nbPions);

        portepion.style.left = xCoord + "vw";
        portepion.style.animation = "pion-vertical 4s linear infinite";
        portepion.style.animationDuration = 4 + Math.floor((Math.random() * 10)) + 's';
        portepion.addEventListener("animationiteration", () => {
            xCoord = Math.floor((Math.random() * nbPions)) * (100 / nbPions);
            portepion.style.left = xCoord + "vw";
        });

        document.getElementById("background").appendChild(portepion);
    }
}

function SetupModal() {
    var modal = document.getElementById("myModal");
    var btnQuitter = document.getElementById("endgame");

    btnQuitter.onclick = function () {
        modal.style.display = "none";
        MenuTransition();
        // window.location.replace("menu.html");
    }
}

function EasterEgg() {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
}

function MenuTransition() {
    document.getElementById("p1").classList.add("square");
}


function Transitions(page) {
    if (page == "index") {
        // Ajout de trigger pour transition
        document.getElementById("p1").addEventListener("animationend", () => {window.location.href = "menu.html"});


        // Setup animation
        document.getElementById("title").style.animation = "title-raise 500ms ease-in-out forwards, Color 4s ease infinite";
        document.getElementById("pseudo").style.visibility = "hidden";
        document.getElementById("reconnexion").style.visibility = "hidden";
        document.getElementById("inscription").style.visibility = "hidden";

        // Animation de startup
        document.getElementById("transition-first").addEventListener("animationend", () => {
            document.getElementById("title").style.animation = "";
            document.getElementById("title").classList.add("load");
            document.getElementById("pseudo").style.visibility = "visible";
            document.getElementById("reconnexion").style.visibility = "visible";
            document.getElementById("inscription").style.visibility = "visible";
            document.getElementById("transition-first").style.visibility = "hidden";
            CreateAnimatedBackground();
        });
    }
    else if (page == "jeu") {
        document.getElementById("p1").addEventListener("animationend", () => {window.location.href = "menu.html"});
    }
    else if (page == "menu") {
        const transition = document.getElementById("transition");
        transition.addEventListener("animationend", () => 
        {
            transition.hidden = true;
        });
    }
}

// Script lancé au lancement de chaque page
document.addEventListener("DOMContentLoaded", async function () {
    const urlActuelle = window.location.href;
    const pseudo = localStorage.getItem("pseudo");

    console.log("pseudo enregistré : " + pseudo);
    console.log(urlActuelle);

    // En fonction de la page
    if (urlActuelle.includes("index") || urlActuelle == "http://127.0.0.1:5500/") {
        Transitions("index");
        if (localStorage.getItem("pseudo") != "") {
            console.log("Ancien pseudo : " + pseudo);
            document.getElementById("reconnexion").textContent = phraseReconnexion + pseudo;
        }
        else {
            console.log("Bouton désactivé");
            document.getElementById("reconnexion").hidden = true;
        }
    }
    else if (urlActuelle.includes("menu")) {
        Transitions("menu");
        document.getElementById("videoChill").addEventListener('click', () => {EasterEgg();});
        CreateAnimatedBackground();
        showWhoIsConnected();
    }
    else if (urlActuelle.includes("jeu")) {
        Transitions("jeu");
        SetupModal();
        showWhoIsConnected(); // Affiche qui est connecté
        addInteractions();
        // Main loop
        while (!gameEnd) {
            refresh();
            await sleep(1000);
        }

    }
});