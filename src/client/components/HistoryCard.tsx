import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../hooks/reduxHooks";
import { fetchData } from "../components/fetch/fetch";

import type { HistoryEntry } from "../../server/types/history_types";
import "./HistoriyCard.css";

type HistoryScope = "me" | "all";

type HistoryCardProps = {
  scope: HistoryScope;
  list?: "score" | "date" | "win" | "lose";
  title?: string;
  start?: number;
  end?: number;
  username?: string;
};

function formatDate(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString();
}

export default function HistoryCard({
  scope,
  list = "date",
  title,
  start = 0,
  end = 10,
  username: filterUsername,
}: HistoryCardProps) {
  const currentUser = useAppSelector((s) => s.user.username);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const resolvedTitle = useMemo(() => {
    if (title) return title;
    if (scope === "me") return "My game history";
    return `Top games (${list})`;
  }, [title, scope, list]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        let url = "";

        if (filterUsername) {
          url = `/history/users/${encodeURIComponent(filterUsername)}?start=${start}&end=${end}`;
        } else if (scope === "me") {
          url = `/history/me?start=${start}&end=${end}`;
        } else {
          switch (list) {
            case "score":
              url = `/history/score?start=${start}&end=${end}`;
              break;
            case "win":
              url = `/history/win?start=${start}&end=${end}`;
              break;
            case "lose":
              url = `/history/lose?start=${start}&end=${end}`;
              break;
            default:
              url = `/history/date?start=${start}&end=${end}&new_first=true`;

          }
        }

        const res = await fetchData(url, null, "GET");
        const data = res?.data;

        if (!cancelled) {
          setEntries(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load history");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scope, list, start, end, filterUsername]);

  return (
    <div className="card-container">
      <div className="card-top">
        <h2 className="history-card__title">{resolvedTitle}</h2>
        <div className="history-card__badge">
          {loading ? "" : `${entries.length} games`}
        </div>
      </div>

      {error ? <div className="history-card-error">{error}</div> : null}

      {!loading && entries.length === 0 ? (
        <div className="history-card-empty">No history yet.</div>
      ) : null}

      <div className="card-history-grid">
        {entries.map((e) => (
          <div
            key={`${e.lobby_id}-${e.end_date}-${e.username}-${e.score}`}
            className="card-history-item"
          >
            <div className="history-card-row">
              <span className="card-history-user">{e.username}</span>
              <span className={e.is_winner ? "history-card-win" : "history-card-lose"}>
                {e.is_winner ? "WIN" : "LOSE"}
              </span>
            </div>

            <div className="card-history-score">Score: {e.score}</div>
            <div className="card-history">
              <div>Mode: {e.game_mode}</div>
              <div>Time: {e.total_time}</div>
              <div>Date: {formatDate(e.end_date)}</div>
              <div className="card-history-lobby">Lobby: {e.lobby_id}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}