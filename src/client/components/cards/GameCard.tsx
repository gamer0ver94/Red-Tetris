
type Props = {
  username: string;
  score?: number | null;
  currentPieceType: string | null;
  nextPiecesTypes: string[] | null;
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

type Cell = '.' | 'X';

type Shape = Cell[][];

const PIECE_SHAPES: Record<string, Shape> = {
  // 4x4-ish previews, centered via grid rendering below
  I: [
    ['.', 'X', 'X', 'X'],
    ['.', '.', '.', 'X'],
    ['.', '.', '.', '.'],
    ['.', '.', '.', '.'],
  ],
  T: [
    ['.', 'X', '.', '.'],
    ['X', 'X', 'X', '.'],
    ['.', '.', '.', '.'],
    ['.', '.', '.', '.'],
  ],
  O: [
    ['.', 'X', 'X', '.'],
    ['.', 'X', 'X', '.'],
    ['.', '.', '.', '.'],
    ['.', '.', '.', '.'],
  ],
  J: [
    ['X', '.', '.', '.'],
    ['X', 'X', 'X', '.'],
    ['.', '.', '.', '.'],
    ['.', '.', '.', '.'],
  ],
  L: [
    ['.', '.', 'X', '.'],
    ['X', 'X', 'X', '.'],
    ['.', '.', '.', '.'],
    ['.', '.', '.', '.'],
  ],
  S: [
    ['.', 'X', 'X', '.'],
    ['X', 'X', '.', '.'],
    ['.', '.', '.', '.'],
    ['.', '.', '.', '.'],
  ],
  Z: [
    ['X', 'X', '.', '.'],
    ['.', 'X', 'X', '.'],
    ['.', '.', '.', '.'],
    ['.', '.', '.', '.'],
  ],
};

export default function GameCard({
  username,
  score = null,
  currentPieceType,
  nextPiecesTypes,
}: Props) {
  return (
    <div>
      <div>Game Card</div>

      <div>
        <div>
          <div>Player</div>
          <div>{username || '—'}</div>
        </div>

        <div>
          <div>Score</div>
          <div>{score ?? '—'}</div>
        </div>

        <div>
          <div>Current Piece</div>
          <div>{currentPieceType ?? '—'}</div>
        </div>

        <div>
          <div>Next Pieces{nextPiecesTypes}</div>
        </div>
      </div>
    </div>
  );
}

