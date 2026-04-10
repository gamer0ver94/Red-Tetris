import GameBoard from "../components/GameBoard";
import "./Game.css";
import { useSelector } from "react-redux"

export default function Game() {
    const board = useSelector((state: any) => state.game.board)
    const score = useSelector((state: any) => state.game.score)
    return (
        <div>
            <h1>{score}</h1>
            <GameBoard/>
        </div>
    )
}