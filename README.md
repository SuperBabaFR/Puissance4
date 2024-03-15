# Puissance4

# Description
Il s'agit d'un projet de M1 MIAGE, un puissance 4 web qui utilise une API réalisée par un professeur.
Description de l'API : https://trankillprojets.fr/P4/index.html

# Fonctionalitées
Voici la liste des fonctionalitées de l'API qui sont implémentées.
## Page d'inscription / Menu principal
- Incription : La première page permet de s'inscrire à l'aide d'un pseudo
- Reconnexion : Votre dernière connexion est enregistrée par le navigateur, pour ne pas avoir a recréer un pseudo. (L'API ne gère pas la reconnexion juste l'utilisation d'un identifiant unique, fourni au moment de l'inscription.)

## Page Menu
- Jouer : Permet de lancer la recherche d'une partie, Relance automatiquement la recherche d'une partie au bout de 2 minutes si aucune partie n'a été trouvée.
- Easter Egg : cliquez sur l'animation de recherche de partie :).
- Déconnexion : Retourne au Menu Principal pour pouvoir changer de pseudo / Abandonne une recherche de partie en cours.

## Page Jeu
- Affichage des pseudonymes : Le premier joueur est toujours en rouge et à gauche, le deuxième lui est à droite et en jaune. (L'index du joueur est géré par l'API)
- Affichage du tour : Le joueur qui doit jouer voit son pseudo sur-élevé avec une ombre portée en plus d'avoir une animation de zoom sur le pseudo qui doit jouer.
- Affichage du plateau :
- Toutes les cases permettent de jouer son coup, elles réagissent en fonction de la situation :
  - Lorsqu'il s'agit de son tour, les cases survolées prennent la couleur du joueur, avec le curseur en forme de "+".
  - Lorsque la case est déjà pleine, le curseur prends la forme d'une croix
  - Lorsque la case est vide, mais c'est pas le tour du joueur le curseur prends la forme du symbole d'attente
- Les pions ont une animation de descente et de rebond.
- Bouton abandonner : Abandonne la partie et retourne au Menu.
- Tout les états : victoire, défaite et abandon jouent une vidéo et musique différente.
- Le cas du match nul est géré.

# Utilisation
Ce puissance 4 permet de jouer uniquement en ligne contre d'autres personnes qui utilisent aussi l'API ou cette application.
Le jeu est responsive, il est adapté au format mobile.
