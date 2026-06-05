
type Props = {
  username: string;
  score?: number | null;
  currentPieceType: string | null;
  nextPiecesTypes: string[] | null;
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
