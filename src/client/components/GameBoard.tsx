import "./GameBoard.css";
import { useState } from "react";

export default function GameBoard() {
    const cols = 10;
    const rows = 20;

    const [board, setBoard] = useState(
        Array.from({ length: rows }, () =>
            Array(cols).fill(0)
        )
    );

    function fill(x: number, y: number) {
        const newBoard = board.map(row => [...row]);
        newBoard[y][x] = newBoard[y][x] ? 0 : 1;
        setBoard(newBoard);
    }

    return (
        <div className="board">
            {board.map((row, i) => (
                <div key={i} className="row">
                    {row.map((cell, j) => (
                        <div
                            key={j}
                            className={cell ? "a" : "cell"}
                            onClick={() => fill(j, i)}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}