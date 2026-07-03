import "./NextPieces.css";

type Props = {
  nextPieces: string[] | null;
};

const PIECE_COLORS: Record<string, string> = {
  I: '#00B8CC',
  J: '#3B67CC',
  L: '#D99119',
  S: '#00B85A',
  T: '#8F69CC',
  Z: '#CC4141',
  O: '#C7A83E',
};

const PIECE_SHAPES: Record<string, string[][]> = {
  I: [
    ['I', 'I', 'I', 'I']
  ],
  J: [
    ['J', '.', '.'],
    ['J', 'J', 'J']
  ],
  L: [
    ['.', '.', 'L'],
    ['L', 'L', 'L']
  ],
  O: [
    ['O', 'O'],
    ['O', 'O']
  ],
  S: [
    ['.', 'S', 'S'],
    ['S', 'S', '.']
  ],
  T: [
    ['T', 'T', 'T'],
    ['.', 'T', '.']
  ],
  Z: [
    ['Z', 'Z', '.'],
    ['.', 'Z', 'Z']
  ],
};

const EMPTY_PIECE_SHAPE:string[][] = [
  ['.', '.'],
  ['.', '.'],
];

export default function NextPieces({ nextPieces }: Props) {
  if (!nextPieces || nextPieces.length === 0) {
    return null;
  }
  return (
    <div className="next-pieces">
      <p className="next-pieces-label">Next Pieces</p>
      <div className="next-pieces-container">
        {nextPieces.slice(0, 3).map((pieceType, index) => (
          <div key={index} className="next-piece">
            <span className="next-piece-label">{index + 1}</span>
            <div className="next-piece-board">
              {PIECE_SHAPES[pieceType]?.map((row, rowIndex) => (
                <div key={rowIndex} className="next-piece-row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`next-piece-cell ${cell !== '.' ? 'next-piece-cell-filled' : ''}`}
                      style={
                        cell !== '.' && PIECE_COLORS[cell]
                          ? { backgroundColor: PIECE_COLORS[cell] }
                          : undefined
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PiecePreview({pieceType} : {pieceType:string | null}){
  const shape = pieceType ? PIECE_SHAPES[pieceType] : EMPTY_PIECE_SHAPE
    return (
    <div className="next-piece-board">
      {shape?.map((row, rowIndex) => (
        <div key={rowIndex} className="next-piece-row">
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className={`next-piece-cell ${cell !== '.' ? 'next-piece-cell-filled' : ''}`}
              style={
                cell !== '.' && PIECE_COLORS[cell]
                  ? { backgroundColor: PIECE_COLORS[cell] }
                  : undefined
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}