export const pieceType = {
    I:'I',
    J:'J',
    L:'L',
    S:'S',
    T:'T',
    Z:'Z',
    O:'O'
}as const;

export type PieceType = typeof pieceType[keyof typeof pieceType];

export type EmptyCell = '.';

export type GarbageCell = 'X';

export type BoardCell = EmptyCell | GarbageCell | PieceType;

export type BoardType = BoardCell[][];


export const pieceShapes:Record<PieceType, BoardType> = {
    I:[
        ['I', 'I', 'I', 'I'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
    ],
    J:[
        ['J', '.', '.', '.' ],
        ['J', 'J', 'J', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
    ],
    L:[
        ['.', '.', 'L', '.'],
        ['L', 'L', 'L', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
    ],
    S:[
        ['.', 'S', 'S', '.'],
        ['S', 'S', '.', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
    ],
    T:[
        ['.', 'T', '.', '.'],
        ['T', 'T', 'T', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
    ],
    Z:[
        ['Z', 'Z', '.', '.'],
        ['.', 'Z', 'Z', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
    ],
    O:[
        ['.', 'O', 'O', '.'],
        ['.', 'O', 'O', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
    ],
}as const;

export type PieceShape = typeof pieceShapes[keyof typeof pieceShapes];

export type GameInput = 
| {type:'LEFT', phase:'press'}
| {type:'LEFT', phase:'release'}
| {type:'RIGHT', phase:'press'}
| {type:'RIGHT', phase:'release'}
| {type:'HOLD'}
| {type:'ROTATE'}
| {type:'SOFT_DROP'}
| {type: 'HARD_DROP'
}

export type RotationType = 0 | 1 | 2 | 3;

export type RotationTransition =   
  | "0>1"
  | "1>2"
  | "2>3"
  | "3>0"
  | "1>0"
  | "2>1"
  | "3>2"
  | "0>3";

export type KickType = [number, number];

export type EndGameCondition = 'survival'|'first_lost'|'score'|'lines'|'time';
