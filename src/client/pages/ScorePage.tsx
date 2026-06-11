import { useNavigate, useLocation } from "react-router-dom";
import GameBoard from "../components/game/Board";
import "./ScorePage.css"
type ScorePageProps = {
  score: number;
  result: "win" | "lose";
  matchHistory: string[];
};

export default function ScorePage() {
  const goTo = useNavigate();
  const location = useLocation();

  const { score, result } =
    (location.state as ScorePageProps) || {
      score: 0,
      result: "lose",
      matchHistory: [],
    };

  return (
    <div className="score-page neon">
      <div className="score-card neon">
        <h1>Score Boarder:</h1>

        <p>Score: {score}</p>
        <p>Result: {result}</p>

        
      </div>
      <div className="game-state">
        <GameBoard />
      </div>
      <button onClick={() => goTo("/lobby")}>
        Return to Lobby
      </button>
    </div>
  );
}