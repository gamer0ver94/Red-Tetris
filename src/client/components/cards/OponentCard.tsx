type PlayerCardProps = {
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
}: PlayerCardProps) {
  return (
    <div className="player-card">
      <div className="player-header">
        <h3>{username}</h3>

        {isOwner && <span className="owner-badge">Owner</span>}
      </div>

      <div className="player-status">
        Status:{" "}
        <span
          style={{
            color: status === "ready" ? "green" : "orange",
          }}
        >
          {status}
        </span>
      </div>

      {onReady && (
        <button onClick={onReady}>
          {status === "ready" ? "Unready" : "Ready"}
        </button>
      )}

      {onReturn && (
        <button onClick={onReturn} className="leave-btn">
          Leave
        </button>
      )}
    </div>
  );
}
