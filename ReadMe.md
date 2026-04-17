### POUR LANCER SITE
+ make up
+ make re

### client URL , temporaire 

+ http:localhost:1700

### SWAGGER 

+ htpp:localhost:1800/docs/routes

### AsyncAPI (swagger for sockets)

+ http:localhost:1800/docs/sockets/



class Board {
    keeps tracks of pieces
}

class Piece{
    each piece has X block
    Rotate and move
} 

class block {
    core object
    used to check colisions, full rows, ...
}

class GameCore?{
    subclass?: 
        Win_condition:
        Score:
        SpawnPieces:
        GameType:("single | multi")
}