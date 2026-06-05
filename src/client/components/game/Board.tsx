import { useSelector } from 'react-redux';
import GameCell from './Cell';
import "./Board.css"
type BoardCell = '.' | 'X' | string;

type Props = {
  board?: BoardCell[][] | null;
};

export default function GameBoard({ board: boardProp }: Props) {
  const boardFromStore = useSelector(
    (state: any) => state.game?.board ?? state.gameSlice?.board ?? undefined
  ) as BoardCell[][] | null;

  const board = (boardProp ?? boardFromStore) as BoardCell[][] | null;

  if (!board) {
    return <div style={{ padding: 12 }}>Waiting for game render...</div>;
  }

  return (
    <div className='Board'>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="Boarder">
          {row.map((cell, colIndex) => (
            <GameCell key={colIndex} cell={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}


