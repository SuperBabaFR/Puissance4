// { "pseudo" : "pseudonyme", "identifiant" : "code", "etat" : "OK" }

const urlAPI = "https://trankillprojets.fr/P4/?";

const phraseReconnexion = "Reconnexion : ";
const phraseConnecte = "Connecté en tant que ";

const colorJ1 = "rgb(255, 77, 77)";
const colorJ2 = "rgb(255, 204, 0)";

 
const etat = Object.freeze({ 
    KO: "KO", // votre compte n'est pas reconnu par le serveur
    OK: "OK", // votre compte est reconnu par le serveur
    ENATTENTE: "En attente" ,// Il n'y a pas encore d'adversaire
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
    
    window.location.replace("menu.html");
}

// Reconnexion avec un pseudo précédemment enregistré
function Reconnexion() {
    window.location.replace("menu.html");
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

    if (etatSearch.textContent != "") {
        // Demande un abandon de la recherche uniquement si elle à été lancée
        Giveup();
    }
    
    console.log("Quitter");
    window.location.replace("index.html");
}

async function Play() {
    // Lancer la partie
    const id = localStorage.getItem("id");
    const apicall = await fetch(urlAPI + "participer&identifiant=" + id);
    const reponse = await apicall.json();

    console.log("Participer : ", reponse);

    const etatSearch = document.getElementById("etat");

    if (reponse.etat == etat.ENATTENTE) {
        etatSearch.textContent = "Recherche d'aversaire...";
        etatSearch.style.animation = "rotate-hor-center 1.5s cubic-bezier(0.455, 0.030, 0.515, 0.955) 0.5s infinite both";
        WaitingGame();
    }
    else if (reponse.etat == etat.ENCOURS) {
        localStorage.setItem("joueur", parseInt(reponse.joueur));
        window.location.replace("jeu.html");
    }
}

// Rafraîchit les informations de la partie
async function refresh() {
    const Id = localStorage.getItem("id");
    const pseudo = localStorage.getItem("pseudo");
    const joueurIndex = localStorage.getItem("joueur");

    const apicall = await fetch(urlAPI + "statut&identifiant=" + Id);
    const reponse = await apicall.json();
    console.log("Statut (Playing) : ", reponse);

    const h2J1 = document.getElementById('j1');
    const h2J2 = document.getElementById('j2');

    if (reponse.etat == etat.ENCOURS) {
        if (reponse.adversaire == null) {
            console.log("partie crash");
            Quitter();
        }

        monTour = (joueurIndex == reponse.tour);
        h2J1.textContent = joueurIndex == 1 ? pseudo : reponse.adversaire;
        h2J2.textContent = joueurIndex == 2 ? pseudo : reponse.adversaire;
        
        if (reponse.tour == "1") {
            h2J1.style.animation = "text-pop-up-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both";
            h2J2.style.animation = "";
        }
        else {
            h2J1.style.animation = "";
            h2J2.style.animation = "text-pop-up-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both";
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
        window.location.replace("menu.html");
    }
    else {
        alert('crash server');
    }

    if (reponse.carte != undefined) {
        updatePlateau(reponse.carte);
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
                portepion.style.animation = "pionFall 0.5s linear both";
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

    for (var i=1; i<=42; i++) {
        let colonne = (i % 7==0)? 7 : i % 7;
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
    const Id = localStorage.getItem("id");

    apicall = await fetch(urlAPI + "jouer&position=" + colonne + "&identifiant=" + Id);
    reponse = await apicall.json();

    console.log("Jouer(" + colonne + ") : ", reponse);
    
    monTour = (joueurIndex == reponse.tour);
    
    updatePlateau(reponse.carte);

    if (reponse.etat.includes("gagne")) {
        GameEnd(reponse.etat.includes(localStorage.getItem("joueur")));
    }
}

function GameEnd(IamWinner)
{
    gameEnd = true;
    
    if (IamWinner != null) {
        if (IamWinner) {
            showModal("Vous avez gagné !", 2000);

        }
        else {
            showModal("Vous avez perdu...", 2000);
        }
    }
    else {
        showModal("il a ragequit...", 2000);
    }
}


async function showModal(message, wait) {
    var modal = document.getElementById("myModal");
    var stateText = document.getElementById("state");

    stateText.textContent = message;

    if(wait != undefined) {
        await sleep(wait);
    }

    modal.style.display = "block";
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
            Play();
            return;
        }
        // Délai entre chaque tentative de lecture du statut
        await sleep(3000);

    } while (reponse.etat == etat.ENATTENTE)

    localStorage.setItem("joueur", parseInt(reponse.joueur));

    window.location.replace("jeu.html");
}

async function Giveup() {
    // Abadonner la partie
    let id = localStorage.getItem("id");
    const apicall = await fetch(urlAPI + "abandonner&identifiant=" + id);
    const reponse = await apicall.json();
    console.log(reponse);
    
    if (reponse.etat.includes("gagne")) {
        ("Vous avez abandonné votre partie !");
        window.location.replace("menu.html");
    }
    else if (reponse.etat == etat.KO) {
        console.log("personne dans la partie");
        window.location.replace("menu.html");
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
        xCoord = Math.floor((Math.random() * nbPions)) * (100/nbPions);

        div.style.left = xCoord + "vw";
        div.style.animation = "pion-vertical 4s linear infinite";
        div.style.animationDuration = 4 + Math.floor((Math.random() * 10)) + 's';
        div.addEventListener("animationiteration", () => {replacePion(div);});

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
        
        xCoord = Math.floor((Math.random() * nbPions)) * (100/nbPions);

        portepion.style.left = xCoord + "vw";
        portepion.style.animation = "pion-vertical 4s linear infinite";
        portepion.style.animationDuration = 4 + Math.floor((Math.random() * 10)) + 's';
        portepion.addEventListener("animationiteration", () => { 
            xCoord = Math.floor((Math.random() * nbPions)) * (100/nbPions);
            portepion.style.left = xCoord + "vw";
        });

        document.getElementById("background").appendChild(portepion);
    }
}

function SetupModal() {
    // Get the modal
    var modal = document.getElementById("myModal");

    // Get the <span> element that closes the modal
    var btnQuitter = document.getElementById("endgame");

    // When the user clicks on <span> (x), close the modal
    btnQuitter.onclick = function() {
        modal.style.display = "none";
        window.location.replace("menu.html");
    }
}

// Script lancé au lancement de chaque page
document.addEventListener("DOMContentLoaded", async function() {
    const urlActuelle = window.location.href;
    const pseudo = localStorage.getItem("pseudo");

    console.log("pseudo enregistré : " + pseudo);
    console.log(urlActuelle);

    // En fonction de la page
    if (urlActuelle.includes("index") || urlActuelle == "http://127.0.0.1:5500/") {
        CreateAnimatedBackground();

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
        CreateAnimatedBackground();
        showWhoIsConnected();
    }
    else if (urlActuelle.includes("jeu")) {
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