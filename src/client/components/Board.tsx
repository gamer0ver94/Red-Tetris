import { useSelector } from "react-redux";
import GameCell from "./Cell";

type Cell = 0 | 1;

export default function GameBoard() {
  const board = useSelector((state: any) => state.game.board) as Cell[][];

  return (
    <div>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: "flex" }}>
          {row.map((cell, colIndex) => (
            <GameCell key={colIndex} filled={cell === 1} />
          ))}
        </div>
      ))}
    </div>
  );
}