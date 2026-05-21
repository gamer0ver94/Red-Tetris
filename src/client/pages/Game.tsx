import { useContext, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { setBoard } from '../store/gameSlice';
import { socketContext } from '../socket/socketContext';
import GameBoard from '../components/Board';
import GameCard from '../components/GameCard';
import { InputHandler } from '../components/InputHandler';
import type { RenderPayload } from '../Types/RenderPayload';
import styles from './Game.module.css';

export default function Game() {
  const socket = useContext(socketContext);
  const dispatch = useAppDispatch();

  const username = useAppSelector((s: any) => s.user?.username ?? '');

  const [latestRender, setLatestRender] = useState<RenderPayload | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onRender = (payload: RenderPayload) => {
      dispatch(setBoard(payload.self.board));
      setLatestRender(payload);
    };

    socket.on('game:render', onRender);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off('game:render', onRender);
    };
  }, [socket, dispatch]);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.boardWrap}>
          <GameBoard />
          <InputHandler />
        </div>

        <GameCard
          username={username}
          score={null}
          currentPieceType={latestRender?.self?.current_piece_type ?? null}
          nextPiecesTypes={latestRender?.self?.next_piece_types ?? null}
        />
      </div>
    </div>
  );
}


