# ROUTES

+ join game (GET /game/join:game_id)
+ reset game render (GET game/:game_id)

# EVENT SOCKET BACK 2 FRONT

+ misc 
    + change player status {player_status:change , new_status:...}
    + change game status {game_status:change, new_status:...}

+ lobby 
    + user joined a lobby {lobby:joined, username:...}
    + user leaves a lobby {lobby:left, username:..., new_owner_name?:...}
    + owner started the game {lobby:started}

//NOT IMPLEMENTED YET
+ game 
    + render {game:render ....}
    + end_game {game:end, winner_name: , is_self: true|false, was_kick: true|false}

# EVENT SOCKET FRONT 2 BACK 

+ lobby 
    + join lobby 
        + succes => { lobby:join, game_id:...}
        + error => { lobby:join_error, reason:...}
    + exit lobby { lobby:exit }
    + start game { lobby:start }

+ game 
    + move {game:move, dir:left|right}
    + drop {game:drop, strength: low| default| high}
    + rotate {game:rotate}
    + user exit before the end { game:exit }


### ALL TO DO BEFORE GAME core : 

socket_tests
route get join + test
Add clean deletion of users(sids and playerStore/Player classes) + test

game_types:

board{

    game_id:
    player_id:
    socket_id:
    items[]:
}

item{
    pos:
    is_current:
    type:
}

items_types{
    I {
        [., ., ., .]
        [X, X, X, X]
    }

    J{
        [X, ., ., .]
        [X, X, X, .]
    }

    L{
        [., ., X, .]
        [X, X, X, .]
    }

    S{
        [., X, X, .]
        [X, X, ., .]
    }

    T{
        [., X, ., .]
        [X, X, X, .]
    }

    Z{
        [X, X, ., .]
        [., X, X, .]
    }
}

game class ->  send socket, create boards based on type and mode game 
board class -> keep tracks of personal "map", and tracks of blocks
pieces class -> only the current movable one, can move and rotate, soft/hard drop, check colision within board

