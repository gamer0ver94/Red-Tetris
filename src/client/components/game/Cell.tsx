type Props = {
  cell: '.' | 'X' | string;
};

const PIECE_COLORS: Record<string, string> = {
  I: '#00B8CC',
  J: '#3B67CC',
  L: '#D99119',
  S: '#00B85A',
  T: '#8F69CC',
  Z: '#CC4141',
  O: '#C7A83E',
  X: '#6F6F6F',
};


export default function GameCell({ cell }: Props) {
  const isEmpty = cell === '.';
  const bg = isEmpty ? '#2a2a2a' : (PIECE_COLORS[cell] ?? 'cyan');


  const filledLike = !isEmpty;
  const border = filledLike ? '1px solid rgba(60,60,60,0.25)' : '1px solid rgba(40,40,40,0.25)';

  return (
    <div
      style={{
        width: '26px',
        height: '26px',
        backgroundColor: bg,
        border,
        boxShadow: filledLike ? `inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 12px ${bg}22` : 'none',
      }}
    />
  );
}
