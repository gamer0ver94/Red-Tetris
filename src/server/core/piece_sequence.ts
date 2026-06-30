import { pieceType, PieceType } from "../types/game_types.js";

export type RandomInt = (max: number) => number;

export type AdvancePieceSequenceResult =
    | { type: "next_index"; index: number }
    | { type: "loop_sequence"; index: 0 }
    | { type: "append_sequence"; index: number; sequence_to_append: PieceType[] }
    | { type: "replace_sequence"; index: 0; sequence: PieceType[] };

export const DEFAULT_PIECES: PieceType[] = Object.values(pieceType) as PieceType[];

export function shuffle_pieces(
    pieces: PieceType[],
    random_int: RandomInt,
): PieceType[] {
    const sequence = [...pieces];

    for (let i = sequence.length - 1; i > 0; i -= 1) {
        const j = random_int(i + 1);
        const tmp = sequence[i];

        sequence[i] = sequence[j];
        sequence[j] = tmp;
    }

    return sequence;
}

export function create_piece_sequence(
    random_int: RandomInt,
    pieces: PieceType[] = DEFAULT_PIECES,
): PieceType[] {
    return shuffle_pieces(pieces, random_int);
}

export function peek_piece(
    sequence: PieceType[],
    index: number,
    offset = 0,
): PieceType | null {
    if (sequence.length === 0)
        return null;

    return sequence[(index + offset) % sequence.length];
}

export function peek_pieces(
    sequence: PieceType[],
    index: number,
    count: number,
): PieceType[] {
    const pieces: PieceType[] = [];

    for (let offset = 0; offset < count; offset += 1) {
        const piece = peek_piece(sequence, index, offset);

        if (piece)
            pieces.push(piece);
    }

    return pieces;
}

export function should_extend_sequence_for_peek(
    index: number,
    sequence_length: number,
    preview_count: number,
): boolean {
    if (sequence_length === 0)
        return true;

    return index + preview_count > sequence_length;
}

export function advance_piece_sequence(
    index: number,
    sequence_length: number,
    random_enabled: boolean,
    shared_enabled: boolean,
    next_sequence: PieceType[],
): AdvancePieceSequenceResult {
    const next_index = index + 1;

    if (next_index < sequence_length) {
        return {
            type: "next_index",
            index: next_index,
        };
    }

    if (!random_enabled) {
        return {
            type: "loop_sequence",
            index: 0,
        };
    }

    if (shared_enabled) {
        return {
            type: "append_sequence",
            index: next_index,
            sequence_to_append: next_sequence,
        };
    }

    return {
        type: "replace_sequence",
        index: 0,
        sequence: next_sequence,
    };
}
