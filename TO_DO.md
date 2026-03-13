Shit .js to .ts OR use architecture here and build -> Ts Node.js for back -> Vue or React(already here) or Angular ? 


ROUTES : 

    GET :
        / , index
        /join/?tok -> join game from link
        /create -> render create game menu

    POST:
        /init -> args : username, socket, CSRF_tok(?)
        /create -> backend "creates" game room -> args -> username, CSRF_tok, JSON_settings({type:"solo"|"multi",hard_mode:true ...})
socket message map : 

    all message follows same pattern (to:"server"|"client", action:"init_app", ...)

    init_app
    exit_app
    join_game -> params -> player_id, room_id, join_tok,
    start_game -> params -> room_id, starter_id(player who triggers it)
    end_game -> params -> room_id, ender_id
    render_game -> params -> room_id, game_id_player, game_pos_player(JSON map), game_id_opponent, game_pos_opponent
    move_piece -> params -> room_id, player_id, direction
    rotate_piece -> params -> room_id, player_id
    drop_piece -> params -> room_id, player_id, type:"hard"|soft
    <!-- clear_row -> params -> room_id, game_id, row_pos(simple int) -->
    <!-- add_row -> params -> room_id, game_id, row_pos(simple int) -->
    
    


class shared(?) signature :
    server keeps Map[room_id, room_obj]
    room{
        room_id,
        type,
        settings? (JSON)
        Map[player_id, game_id]
    }

    game{
        game_id:
        garbage_rows?
        player_id:
        placed_pieces: Map[piece_id, piece_pos]
        current_piece: [piece_id, piece_pos]
    }

    player{
        player_id,
        player_name,
        player_socket,
        score,
        meta_data (JSON) (longest strike?, moves count? ...)
    }

    piece{
        piece_id:
        piece_type:
        piece_pos: [x, y]
    }

    JSON map{
        item{
            type
            pos
        }
        item{

        }
        ...
    }

