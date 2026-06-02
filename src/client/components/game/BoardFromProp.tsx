import GameCell from './Cell';

type BoardCell = '.' | 'X' | string;

type Props = {
  board: BoardCell[][];
};

export default function BoardFromProp({ board }: Props) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: 14,
        borderRadius: 14,
        background: '#2a2a2a',
        border: '6px solid rgba(0,0,0,0.65)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), 0 8px 28px rgba(0,0,0,0.25)',
      }}
    >
      {board.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', lineHeight: 0 }}>
          {row.map((cell, colIndex) => (
            <GameCell key={colIndex} cell={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

