import './PlayerCard.css';

type Props = {
  username: string;
  isOwner: boolean;
  status: "ready" | "not-ready" | string;

  onReady?: () => void;
  onReturn?: () => void;
};

export default function PlayerCard({
  username,
  isOwner,
  status,
  onReady,
  onReturn,
}: Props) {
  return (
    <div className="player-card neon">
      <div className="player-header">
        <div>{username}</div>

        {isOwner && <span className="owner-badge">OWNER</span>}
      </div>

      <div>
        Status:{" "}
        <span style={{ color: status === "ready" ? "green" : "orange" }}>
          {status}
        </span>
      </div>

      <div>
        {onReady && (
          <button onClick={onReady}>
            {status === "ready" ? "Unready" : "Ready"}
          </button>
        )}

        {onReturn && (
          <button onClick={onReturn}>
            Leave
          </button>
        )}
      </div>
    </div>
  );
}