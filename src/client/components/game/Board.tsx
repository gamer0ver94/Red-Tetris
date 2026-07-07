import { useSelector } from 'react-redux';
import GameCell from './Cell';
import "./Board.css"
type BoardCell = '.' | 'X' | string;

type BoardState = {
  game?:{ board?: BoardCell[][] | null};
  gameSlice?:{ board?:BoardCell[][] | null};
};

type Props = {
  board?: BoardCell[][] | null;
};

export default function GameBoard({ board: boardProp }: Props) {
  const boardFromStore = useSelector(
    (state: BoardState) => state.game?.board ?? state.gameSlice?.board ?? undefined
  ) as BoardCell[][] | null;

  const board = (boardProp ?? boardFromStore) as BoardCell[][] | null;

  if (!board) {
    return <div className="waiting-message">Waiting for game render...</div>;
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


