import GameBoard from "../components/Board";
import { InputHandler } from "../components/InputHandler";

export default function Game() {
    return (
        <div>
            <GameBoard />
            <InputHandler/>
        </div>
    )
}