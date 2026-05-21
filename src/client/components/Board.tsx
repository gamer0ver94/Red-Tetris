import { useSelector } from 'react-redux';
import GameCell from './Cell';

type BoardCell = '.' | 'X' | string;

export default function GameBoard() {
  const board = useSelector((state: any) => state.game?.board ?? state.gameSlice?.board ?? undefined) as BoardCell[][] | null;


  if (!board) {
    return <div style={{ padding: 12 }}>Waiting for game render...</div>;
  }

  return (
    <div>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
          {row.map((cell, colIndex) => (
            <GameCell key={colIndex} filled={cell !== '.'} />
          ))}
        </div>
      ))}
    </div>
  );
}

