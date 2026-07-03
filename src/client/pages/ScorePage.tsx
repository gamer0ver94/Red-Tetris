import { useNavigate, useLocation } from "react-router-dom";
import GameBoard from "../components/game/Board";
import "./ScorePage.css";
import PlayerScoreCard from "../components/cards/playerscorecard/PlayerScoreCard";
import { socket } from "../socket/socket";
import { useAppSelector } from "../hooks/reduxHooks";


type ScorePageProps = {
  score: number | null;
  result: "win" | "lose";
  matchHistory: string[];
};

export default function ScorePage() {
  const goTo = useNavigate();
  const location = useLocation();
  const username = useAppSelector((state: any) => state.user?.username ?? "");

  const { score, result } = (location.state as ScorePageProps) || {
    score: null,
    result: "lose",
    matchHistory: [],
  };

  return (
    <div className="score-page neon">
      <div>
        <PlayerScoreCard finishScore={score} result={result} />
      </div>
      <div className="game-state">
        <GameBoard />
          <button
            onClick={() => {
              socket.emit("lobby:update");
              // socket.emit("lobby:join:update", { owner_name: undefined, players: [] });

              const gameId = sessionStorage.getItem("game_id") || "";

              // Use username from Redux store instead of sessionStorage
              // This ensures we always have the correct username
              if (gameId && username) {
                goTo(`/${gameId}/${username}`);
                return;
              }

              goTo("/home");
            }}
          >
          Return to Lobby
        </button>
      </div>

      <div className="empty"></div>
    </div>
  );
}
