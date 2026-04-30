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
        ['.', '.', '.', '.'],
        ['I', 'I', 'I', 'I'],
    ],
    J:[
        ['J', '.', '.', '.' ],
        ['J', 'J', 'J', '.'],
    ],
    L:[
        ['.', '.', 'L', '.'],
        ['L', 'L', 'L', '.'],
    ],
    S:[
        ['.', 'S', 'S', '.'],
        ['S', 'S', '.', '.'],
    ],
    T:[
        ['.', 'T', '.', '.'],
        ['T', 'T', 'T', '.'],
    ],
    Z:[
        ['Z', 'Z', '.', '.'],
        ['.', 'Z', 'Z', '.'],
    ],
    O:[
        ['.', 'O', 'O', '.'],
        ['.', 'O', 'O', '.'],
    ],
}as const;

export type PieceShape = typeof pieceShapes[keyof typeof pieceShapes];
