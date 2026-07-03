import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../../hooks/reduxHooks';
import { fetchData } from '../../fetch/fetch';
import type { HistoryEntry } from '../../../Types/HistoryEntry';

import './PlayerScoreCard.css';

type Props = {
  finishScore: number | null;
  result:"win" | "lose";
};

type RankedEntry = {
  username: string;
  score: number;
};

function getTopScore(entries: RankedEntry[]): number {
  if (!entries.length) return 0;
  return Math.max(...entries.map((e) => e.score));
}

export default function PlayerScoreCard({ finishScore, result }: Props) {
  const username = useAppSelector((s) => s.user.username) ?? '';
  const hasScore = finishScore !== null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [entries, setEntries] = useState<RankedEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hasScore) {
        setEntries([]);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        // We only need enough data to determine top score / ranking.
        // Using existing endpoint used by HistoryCard.
        const res = await fetchData(`/history/score?start=0&end=50`, null, 'GET');
        const data = res?.data;

        if (cancelled) return;

        const list = Array.isArray(data) ? (data as HistoryEntry[]) : [];
        const ranked: RankedEntry[] = list
          .filter((e) => typeof e.score === 'number' && typeof e.username === 'string')
          .map((e) => ({ username: e.username, score: e.score }));

        // Sort desc and keep unique usernames (best score per user)
        const bestByUser = new Map<string, number>();
        for (const e of ranked) {
          const prev = bestByUser.get(e.username);
          if (prev === undefined || e.score > prev) bestByUser.set(e.username, e.score);
        }

        const deduped: RankedEntry[] = Array.from(bestByUser.entries())
          .map(([u, s]) => ({ username: u, score: s }))
          .sort((a, b) => b.score - a.score);

        const onlyHisScores = deduped.filter((e) => e.username === username);

        setEntries(onlyHisScores);
      } catch {
        if (!cancelled) setError('Failed to load scores');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [hasScore]);

  const topScore = useMemo(() => getTopScore(entries), [entries]);

  const isRecord = useMemo(() => {
    if (finishScore === null) return false;
    if (!entries.length) return true;
    return finishScore >= topScore;
  }, [finishScore, entries.length, topScore]);

  const yourScoreEntry = useMemo(() => {
    if (!username) return null;
    return entries.find((e) => e.username === username) ?? null;
  }, [entries, username]);

  return (
    <div className="playerscorecard neon">
        <div className="playerscorecard__header">
          { hasScore ??(
          <div className={`playerscorecard__record ${isRecord ? 'is-record' : ''}`}>
            {isRecord ? 'RECORD!' : 'Not a record'}
          </div>
          )}
          {result === "win" ? "Winner": "You lost ..."}
        </div>


      {hasScore ? (
        <div className="playerscorecard__score">
          <div>
            <div className="playerscorecard__label">Your finish score</div>
            <div className="playerscorecard__value">{finishScore}</div>
          </div>
        </div>
      ) : null}

      {loading ? <div className="playerscorecard__status">Loading...</div> : null}
      {error ? <div className="playerscorecard__status playerscorecard__status--error">{error}</div> : null}

      {hasScore && !loading && !error ? (
        <div className="playerscorecard__list">
          <div className="playerscorecard__list-title">Top scores</div>
          <div className="playerscorecard__rows">
            {entries.slice(0, 10).map((e, i) => (
              <div
                key={`${e.username}-${i}`}
                className={`playerscorecard__row ${e.username === username ? 'is-you' : ''}`}
              >
                <span className="playerscorecard__pos">{i + 1}</span>
                <span className="playerscorecard__user">{e.username}</span>
                <span className="playerscorecard__score">{e.score}</span>
              </div>
            ))}
            {entries.length === 0 ? <div className="playerscorecard__empty">No scores yet.</div> : null}
          </div>

          {yourScoreEntry && !isRecord ? (
            <div className="playerscorecard__hint">
              Your previous best: <b>{yourScoreEntry.score}</b>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
