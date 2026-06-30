import { BoardCell, BoardType } from "../types/game_types.js";
import { ClearPhaseMode, ClearPhaseState } from "../types/render_types.js";
import { clone_board } from "./board.js";
import { apply_gravity_cell } from "./gravity.js";
import { get_full_lines_indexes, clear_lines } from "./line_clear.js";

const LINE_GLITCH_BLINKS = 5;

export function create_clear_phase(
    board:BoardType,
    mode:ClearPhaseMode,
    now:number,
    frame_delay_ms:number,
):ClearPhaseState|null{
    
    if(mode === 'cell_gravity')
        return create_cell_gravity_clear_phase(board, now, frame_delay_ms);

    return create_regular_clear_phase(board, now, frame_delay_ms);
}

export function advance_phase_state(
    phase:ClearPhaseState, 
    now:number,
    frame_delay_ms:number,
):ClearPhaseState{
    return {
        ...phase,
        frame_index:phase.frame_index + 1,
        next_frame_at:now+frame_delay_ms,
    };
}


export function create_regular_clear_phase(
    board:BoardType,
    now:number,
    frame_delay_ms:number,
):ClearPhaseState|null{

    const line_indexes = get_full_lines_indexes(board);

    if(line_indexes.length === 0)
        return null;

    const clear = clear_lines(board, line_indexes);

    return{
        mode:"regular",
        frames:[
            ...create_line_glitch_frames(board, line_indexes),
            clear.board
        ],
        frame_index:0,
        next_frame_at: now + frame_delay_ms,
        final_board:clear.board,
        cleared_lines:clear.cleared_lines,
        cleared_garbage: clear.cleared_garbage,
    };
}

export function create_cell_gravity_clear_phase(
    board:BoardType,
    now:number,
    frame_delay_ms:number,
):ClearPhaseState|null{

    let current_board = clone_board(board);
    const frames:BoardType[] = [];
    let total_lines = 0;
    let total_garbage = 0;

    while(true){
        const line_indexes = get_full_lines_indexes(current_board)

        if(line_indexes.length === 0)
            break;

        const clear = clear_lines(current_board, line_indexes, 1);

        frames.push(...create_line_glitch_frames(current_board, clear.cleared_indexes));
        frames.push(clear.board);

        current_board = apply_gravity_cell(clear.board)
        frames.push(current_board);

        total_lines += clear.cleared_lines;
        total_garbage += clear.cleared_garbage;
    }
    if(frames.length === 0)
        return null;
    return {
        mode: "cell_gravity",
        frames,
        frame_index: 0,
        next_frame_at: now + frame_delay_ms,
        final_board: current_board,
        cleared_lines: total_lines,
        cleared_garbage: total_garbage,
    };
}

export function get_current_phase_frame(phase: ClearPhaseState): BoardType {
  return phase.frames[phase.frame_index] ?? phase.final_board;
}

export function is_clear_phase_done(phase: ClearPhaseState): boolean {
  return phase.frame_index >= phase.frames.length;
}


function create_line_glitch_frames(
    board:BoardType,
    line_indexes:number[],
    blinks = LINE_GLITCH_BLINKS,
):BoardType[]{
    const frames:BoardType[] = [];

    for(let i = 0; i < blinks; i += 1){
        frames.push(clone_board(board));
        frames.push(mark_lines(board, line_indexes));
    }

    return frames;
}

function mark_lines(
    board:BoardType,
    line_indexes:number[],
    marker:BoardCell = ".",
): BoardType{
    const next_board = clone_board(board);

    for (const y of line_indexes){
        if(y < 0 || y >= next_board.length)
            continue;
        
        next_board[y] = next_board[y].map(() => marker)
    }
    return next_board;
}
