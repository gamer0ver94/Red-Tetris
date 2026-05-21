import type { RenderPayload } from '../Types/RenderPayload';
import styles from '../pages/Game.module.css';

type Props = {
  username: string;
  score?: number | null;
  currentPieceType: string | null;
  nextPiecesTypes: string[] | null;
};

function renderPiecePills(pieceTypes: string[] | null) {
  if (!pieceTypes || pieceTypes.length === 0) {
    return <div className={styles.value}>—</div>;
  }

  return (
    <div className={styles.piecePills}>
      {pieceTypes.map((p, idx) => (
        <div key={`${p}-${idx}`} className={styles.pill}>
          {p}
        </div>
      ))}
    </div>
  );
}

export default function GameCard({
  username,
  score = null,
  currentPieceType,
  nextPiecesTypes,
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Game Card</div>

      <div className={styles.field}>
        <div>
          <div className={styles.label}>Player</div>
          <div className={styles.value}>{username || '—'}</div>
        </div>

        <div>
          <div className={styles.label}>Score</div>
          <div className={styles.value}>{score ?? '—'}</div>
        </div>

        <div>
          <div className={styles.label}>Current Piece</div>
          <div className={styles.value}>{currentPieceType ?? '—'}</div>
        </div>

        <div>
          <div className={styles.label}>Next Pieces</div>
          <div style={{ marginTop: 6 }}>{renderPiecePills(nextPiecesTypes)}</div>
        </div>
      </div>
    </div>
  );
}

