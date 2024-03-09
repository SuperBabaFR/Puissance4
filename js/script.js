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

        console.log(reponse);

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

function Reconnexion() {
    window.location.replace("menu.html");
    
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

function Quitter() {
    // Retour à l'inscription
    Giveup();
    console.log("Quitter");
    window.location.replace("index.html");
}

async function Play() {
    // Lancer la partie
    const Id = localStorage.getItem("id");
    const apicall = await fetch(urlAPI + "participer&identifiant=" + Id);
    const reponse = await apicall.json();
    console.log(reponse);

    if (reponse.etat == "En attente") {
        console.log("en attente ?");
        let etatSearch = document.getElementById("etat");
        etatSearch.textContent = "Recherche d'aversaire...";
        etatSearch.style.animation = "rotate-hor-center 1.5s cubic-bezier(0.455, 0.030, 0.515, 0.955) 0.5s infinite both";
        WaitingGame();
    }
    else if (reponse.etat == "En cours") {
        localStorage.setItem("joueur", parseInt(reponse.joueur));
        window.location.replace("jeu.html");
    }


}

async function refresh() {
    const Id = localStorage.getItem("id");
    const pseudo = localStorage.getItem("pseudo");

    if (gameEnd) {
        return;
    }

    const apicall = await fetch(urlAPI + "statut&identifiant=" + Id);
    const reponse = await apicall.json();
    console.log("refresh");
    console.log(apicall);
    console.log(reponse);

    const h2J1 = document.getElementById('j1');
    const h2J2 = document.getElementById('j2');

    h2J1.style.color = colorJ1;
    h2J2.style.color = colorJ2;

    if (reponse.etat == "En cours")  {

        if (reponse.adversaire == null) {
            console.log("partie crash");
            Giveup();
        }
        
        if (reponse.joueur == "1") {
            h2J1.textContent = reponse.pseudo;
            h2J2.textContent = reponse.adversaire;
        }
        else {
            h2J1.textContent = reponse.adversaire;
            h2J2.textContent = reponse.pseudo;
        }

        const pseudoJ1 = h2J1.textContent;
        const pseudoJ2 = h2J2.textContent;

        if (reponse.tour == "1") {
            h2J1.style.animation = "text-pop-up-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both";
            h2J2.style.animation = "";
        }
        else {
            h2J1.style.animation = "";
            h2J2.style.animation = "text-pop-up-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both";
        }

        monTour = (document.getElementById('j' + reponse.tour).textContent == pseudo);

        updatePlateau(reponse.carte);
        
    }
    else if (reponse.etat.includes("gagne")) {
        if (reponse.carte != undefined) {
            updatePlateau(reponse.carte);
            GameEnd(false);
        } else {
            GameEnd(null);
        }
    }
    else if (reponse.etat == "OK") {
        window.location.replace("menu.html");
    }

}

function updatePlateau(carte) {
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const cellIndex = row * 7 + col + 1;
            const cellValue = carte[row][col];

            const cell = document.getElementById(cellIndex);
            // const imgPion = document.createElement("img");

            const portepion = document.createElement("div");
            const pion = document.createElement("div");

            if (cell.innerHTML == "") {
                if (cellValue > 0) {
                    portepion.classList.add("portePion"); portepion.classList.add("J"+cellValue);
                    pion.classList.add("game-pion"); pion.classList.add("J"+cellValue);
                    
                    const distance = "-" + row + 1 * cell.offsetHeight + "px";
                    console.log(distance);
                    document.documentElement.style.setProperty("--distance", distance);
                    portepion.style.animation = "pionFall 0.5s linear both";
                    portepion.appendChild(pion);
                    cell.appendChild(portepion);
                }
            }
        }
    }
}

function sleep(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
}

function addInteractions() {
    const animation = "cell-pulse-J" + localStorage.getItem("joueur") + " 1s ease-in-out 0s infinite";
    console.log(animation);

    for (var i=1; i<=42; i++) {
        let colonne = (i % 7==0)? 7 : i % 7;
        let td = document.getElementById(i);
        td.addEventListener("click", () => {
            Jouer(colonne);
        });

        td.addEventListener('mouseover', () => {
            // const havePion = (td.innerHTML.includes("img"));
            const havePion = (td.innerHTML.includes("pion"));
            if (monTour && !havePion) {
                td.style.animation = animation;
                td.style.cursor = "cell";
            }
            else if (!monTour && !havePion) {
                td.style.animation = "";
                td.style.cursor = "wait";
            }
            else {
                td.style.animation = "";
                td.style.cursor = "no-drop";
            }
        });
        td.addEventListener('mouseleave', () => {
            td.style.animation = "";
        });
    }
}

async function Jouer(colonne) {
    if (!monTour) {
        return;
    }

    console.log("JOUER " + colonne);
    const Id = localStorage.getItem("id");

    apicall = await fetch(urlAPI + "jouer&position=" + colonne + "&identifiant=" + Id);
    reponse = await apicall.json();
    console.log(reponse);
    monTour = false;
    updatePlateau(reponse.carte);

    if (reponse.etat.includes("gagne")) {
        GameEnd(reponse.etat.includes("1") && reponse.joueur == "1" || 
                reponse.etat.includes("2") && reponse.joueur == "2"); 
    }

}

async function GameEnd(IamWinner)
{
    gameEnd = true;
    // Get the modal
    var modal = document.getElementById("myModal");
    var stateText = document.getElementById("state");

    console.log("Game End : ", IamWinner);
    
    if (IamWinner != null) {
        if (IamWinner)
        {
            stateText.textContent = "Vous avez gagné !";
            // alert("Tu as gagné ! ");
        }
        else
        {
            stateText.textContent = "Vous avez perdu...";
            // alert("dommage t'as perdu...");
        }
    }
    else {
        stateText.textContent = "il a ragequit...";
        // alert();
    }
    await sleep(2000);
    modal.style.display = "block";
}

async function WaitingGame() {
    const Id = localStorage.getItem("id");
    let apicall; 
    let reponse;
    let etatSearch = document.getElementById("etat");

    do {
        apicall = await fetch(urlAPI + "statut&identifiant=" + Id);
        reponse = await apicall.json();
        console.log(reponse);

        if (reponse.etat == "Attente supprimee") {
            etatSearch.textContent = "Relance en cours...";
            etatSearch.style.animation = "shake-horizontal 0.8s cubic-bezier(0.455, 0.030, 0.515, 0.955) both";
            await sleep(3000);
            Play();
            return;
        }

        await sleep(3000);
    } while (reponse.etat == "En attente" || reponse.etat == "Attente supprimee")

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
        alert("Vous avez abandonné votre partie !");
        window.location.replace("menu.html");
    }
    else if (reponse.etat == "KO") {
        alert("Vous tout seul dans la partie, relancez-en une");
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
        portepion.addEventListener("animationiteration", () => { replacePion(portepion); });

        document.getElementById("background").appendChild(portepion);
    }
}


function replacePion(pion) {
    xCoord = Math.floor((Math.random() * nbPions)) * (100/nbPions);
    pion.style.left = xCoord + "vw";
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

document.addEventListener("DOMContentLoaded", async function() {
    // Script ajouté au lancement
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
        // Affiche qui est connecté
        document.getElementById("connected").textContent = phraseConnecte + pseudo;
        addInteractions();
        while (true) {
            refresh();
            await sleep(1000);
        } 
        
    }
});



                    

                    




// if (cellValue == 1) {
//     pion.style.backgroundColor = pionInJ1;
//     pion.style.borderColor = "#c20000";
//     portepion.style.backgroundColor = pionOutJ1;
//     // imgPion.src = "images/pion rouge.png";
// } else if (cellValue == 2) {                
//     pion.style.backgroundColor = pionInJ2;
//     pion.style.borderColor = "#bfb400";
//     portepion.style.backgroundColor = pionOutJ2;
//     // imgPion.src = "images/pion orange.png";
// }
    // imgPion.style.width = '100%';
    // imgPion.style.height = 'auto';
    // imgPion.style.display = 'block';
    // cell.appendChild(imgPion);