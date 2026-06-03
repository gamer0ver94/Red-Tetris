import './PlayerCard.css';

type Props = {
  username: string;
  ready: boolean;
  onReady: () => void;
  onReturn: () => void;
};

export default function PlayerCard({ username, ready, onReady, onReturn }: Props) {
  return (
    <div className="player-card neon">
      <div>
        <div>
        </div>
      </div>
      <div>{username}</div>
      <div>
        Status: <span>{ready ? 'READY' : 'NOT READY'}</span>
      </div>

      <div>
        <button onClick={onReady}>
          {ready ? 'Unready' : 'Ready'}
        </button>
        <button onClick={onReturn}>
          Return
        </button>
      </div>
    </div>
  );
}

