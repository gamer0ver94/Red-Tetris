import styles from './playerCard.module.css';

type Props = {
  username: string;
  ready: boolean;
  onReady: () => void;
  onReturn: () => void;
};

export default function PlayerCard({ username, ready, onReady, onReturn }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrap} aria-hidden>
        <div className={styles.icon}>
          {/* Default player icon */}
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className={styles.name}>{username}</div>
      <div className={styles.meta}>
        Status: <span className={ready ? styles.readyText : styles.notReadyText}>{ready ? 'READY' : 'NOT READY'}</span>
      </div>

      <div className={styles.actions}>
        <button className={styles.readyBtn} onClick={onReady}>
          {ready ? 'Unready' : 'Ready'}
        </button>
        <button className={styles.returnBtn} onClick={onReturn}>
          Return
        </button>
      </div>
    </div>
  );
}

