import "./GameBoard.css"
import { useSelector } from "react-redux"

export default function GameBoard() {
    const board = useSelector((state: any) => state.game.board)
    const piece = useSelector((state: any) => state.game.currentPiece)
    const pos = useSelector((state: any) => state.game.position)

    function getCellValue(x: number, y: number) {
        // If no piece → just return board
        if (!piece) return board[y][x]

        const pieceHeight = piece.length
        const pieceWidth = piece[0].length

        // Check if current cell is inside the piece
        if (
            y >= pos.y &&
            y < pos.y + pieceHeight &&
            x >= pos.x &&
            x < pos.x + pieceWidth
        ) {
            const pieceY = y - pos.y
            const pieceX = x - pos.x

            if (piece[pieceY][pieceX]) {
                return 1 // draw piece
            }
        }

        return board[y][x]
    }

    return (
        <div className="board">
            {board.map((row: number[], y: number) => (
                <div key={y} className="row">
                    {row.map((_: number, x: number) => {
                        const value = getCellValue(x, y)

                        return (
                            <div
                                key={x}
                                className={value ? "block" : "cell"}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    )
}