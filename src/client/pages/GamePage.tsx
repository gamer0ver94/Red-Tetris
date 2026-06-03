import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { setBoard } from '../store/gameSlice';
import { socketContext } from '../socket/socketContext';
import GameBoard from '../components/game/Board';
import GameCard from '../components/cards/GameCard';
import { InputHandler } from '../components/game/InputHandler';
import type { RenderPayload } from '../Types/RenderPayload';

export default function GamePage() {

  const socket = useContext(socketContext);
  const dispatch = useAppDispatch();
  const goTo = useNavigate();

  const username = useAppSelector(
    (state: any) => state.user?.username ?? ''
  );

  const [latestRender, setLatestRender] = useState<RenderPayload | null>(null);
  const [gameOutcome, setGameOutcome] = useState<'win' | 'lose' | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onRender = (payload: RenderPayload) => {
      dispatch(setBoard(payload.self.board));
      console.log('Received render payload:', payload);

      Object.entries(payload.opponents ?? {}).forEach(
        ([opponentUsername, opponent]) => {
          if (
            opponent &&
            (opponent.view === 'full' || opponent.view === 'grid')
          ) {
            dispatch({
              type: 'boardMap/setOpponentBoard',
              payload: {
                username: opponentUsername,
                board: opponent.board,
              },
            });
          }
        }
      );

      setLatestRender(payload);
    };

    const onWin = () => {
      setGameOutcome('win');
      console.log('[socket] game ended: win');
    };

    const onLose = () => {
      setGameOutcome('lose');
      console.log('[socket] game ended: lose');
    };

    socket.on('game:render', onRender);
    socket.on('game:win', onWin);
    socket.on('game:lose', onLose);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('game:render', onRender);
      socket.off('game:win', onWin);
      socket.off('game:lose', onLose);
    };
  }, [socket, dispatch, username]);

  return (
    <div>
      <div>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <GameBoard />
          </div>
          <div
          >
            {latestRender &&
              Object.entries(latestRender.opponents ?? {}).map(
                ([opponentUsername, opponent]) => {
                  if (
                    opponent &&
                    (opponent.view === 'full' || opponent.view === 'grid')
                  ) {
                    return (
                      <div key={opponentUsername} style={{ minWidth: 220 }}>
                        <div
                          style={{
                            fontFamily: "'Press Start 2P', cursive",
                            color: '#8BAC0F',
                            fontSize: 12,
                            textAlign: 'center',
                            marginBottom: 8,
                          }}
                        >
                          {opponentUsername}
                        </div>
                        <GameBoard board={opponent.board} />
                      </div>
                    );
                  }
                  return null;
                }
              )}
          </div>
          {gameOutcome === null && <InputHandler />}

        </div>


        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {gameOutcome !== null && (
            <div>
              <div>
                {gameOutcome === 'win'
                  ? 'YOU WIN'
                  : 'YOU LOSE'}
              </div>
              <button
                onClick={() => goTo('/lobby')}
              >
                Return to Lobby
              </button>
            </div>
          )}

          <GameCard
            username={username}
            score={null}
            currentPieceType={
              latestRender?.self?.current_piece_type ?? null
            }
            nextPiecesTypes={
              latestRender?.self?.next_piece_types ?? null
            }
          />
        </div>
      </div>
    </div>
  );
}