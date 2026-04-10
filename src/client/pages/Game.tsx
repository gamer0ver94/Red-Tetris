
import "./Game.css";
import GameBoard from "../components/GameBoard"
import "./Game.css"
import { useSelector, useDispatch } from "react-redux"
import { useEffect } from "react"
import { dropPiece, startGame } from "../store/store" // adjust path
export default function Game() {
    const dispatch = useDispatch()

    const score = useSelector((state: any) => state.game.score)
    useEffect(() => {
        dispatch(startGame())
    }, [dispatch])

    useEffect(() => {
        const interval = setInterval(() => {
            dispatch(dropPiece())
        }, 500)

        return () => clearInterval(interval)
    }, [dispatch])
    return (
        <div>
            <h1>{score}</h1>
            <GameBoard/>
        </div>
    )
}