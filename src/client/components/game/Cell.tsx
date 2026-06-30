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

// OG VERSION WITHOUT H
// export default function GameCell({ cell }: Props) {
//   const isEmpty = cell === '.';
//   const bg = isEmpty ? '#2a2a2a' : (PIECE_COLORS[cell] ?? 'cyan');


//   const filledLike = !isEmpty;
//   const border = filledLike ? '1px solid rgba(60,60,60,0.25)' : '1px solid rgba(40,40,40,0.25)';

//   return (
//     <div
//       style={{
//         width: '26px',
//         height: '26px',
//         backgroundColor: bg,
//         border,
//         boxShadow: filledLike ? `inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 12px ${bg}22` : 'none',
//       }}
//     />
//   );
// }

//YSEBBAN VERSION TO SEE H
export default function GameCell({ cell }: Props) {

  const isHighlight = cell === 'H';
  const isEmpty = cell === '.';
  let bg:string;
  let border:string;
  let boxShadow:string;
  if(isEmpty){
    bg = '#2a2a2a';
    border = '1px solid #28282840';
    boxShadow = 'inset 0 0 0 1px #ffffff08';
  }
  else if(isHighlight){
    bg = '#303030';
    border = '1px solid #ffffff59';
    boxShadow = 'inset 0 0 0 1px #ffffff29, 0 0 8px #ffffff1a';

  }
  else{
    bg = (PIECE_COLORS[cell] ?? 'cyan');
    border = '1px solid #3c3c3c40';
    boxShadow = `inset 0 0 0 1px #ffffff1a, 0 0 12px ${bg}22`;
  }

  return (
    <div
      style={{
        width: '26px',
        height: '26px',
        backgroundColor: bg,
        border,
        boxShadow,
      }}
    />
  );
}