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



### MAKE store class (inherit all stores )
### ADD docs for socket
### SEND player data instead off raw sid in services


### controllers/ sockets handlers -> sanitze data -> call services 

### services -> never touches sid,io,raw_data, only obj or struct