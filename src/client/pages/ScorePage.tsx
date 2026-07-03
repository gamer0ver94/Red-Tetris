import { useNavigate, useLocation } from "react-router-dom";
import GameBoard from "../components/game/Board";
import "./ScorePage.css";
import PlayerScoreCard from "../components/cards/playerscorecard/PlayerScoreCard";
import { socket } from "../socket/socket";


type ScorePageProps = {
  score: number;
  result: "win" | "lose";
  matchHistory: string[];
};

export default function ScorePage() {
  const goTo = useNavigate();
  const location = useLocation();

  const { score } = (location.state as ScorePageProps) || {
    score: 0,
    result: "lose",
    matchHistory: [],
  };

  return (
    <div className="score-page neon">
      <div>
        <PlayerScoreCard finishScore={score} />
      </div>
      <div className="game-state">
        <GameBoard />
        <button
          onClick={() => {
            socket.emit("lobby:update");
            socket.emit("lobby:join:update", { owner_name: undefined, players: [] });
            goTo(`/${sessionStorage.getItem("game_id") || ""}/${""}`);

          }}
        >
          Return to Lobby
        </button>
      </div>

      <div className="empty"></div>
    </div>
  );
}
