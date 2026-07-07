import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { setBoard } from "../store/gameSlice";
import { socketContext } from "../socket/socketContext";
import GameBoard from "../components/game/Board";
import NextPieces, { PiecePreview } from "../components/game/NextPieces";

import { InputHandler } from "../components/game/InputHandler";
import type { OpponentRender, RenderPayload } from "../Types/RenderPayload";
import { ROUTES } from "../Types/Routes";
// import { fetchData } from "../components/fetch/fetch";
import LogoutButton from "../components/LogoutButton";
// import Logo from "../components/Logo";
import "./GamePage.css";

type OpponentEntry = RenderPayload["opponents"][string];

function getOpponentBoard(opponent: OpponentEntry | undefined | null) {
  if (!opponent) return null;
  if ("board" in opponent) return (opponent as OpponentRender).board ?? null;
  return null;
}

export default function GamePage() {
  const socket = useContext(socketContext);
  const dispatch = useAppDispatch();
  const goTo = useNavigate();

  const username = useAppSelector((state: any) => state.user?.username ?? "");

  const [latestRender, setLatestRender] = useState<RenderPayload | null>(null);
  const [gameOutcome, setGameOutcome] = useState<"win" | "lose" | null>(null);
  const scoreRef = useRef<number | null>(null);
  const onQuit = () => {
    socket.emit("lobby:leave");

    const gameId = sessionStorage.getItem("game_id") || "";
    if (!gameId || !username) {
      goTo("/home");
      return;
    }

    goTo(`/${gameId}/${username}`);
  };
  useEffect(() => {
    if (!socket) return;

    const onRender = (payload: RenderPayload) => {
      dispatch(setBoard(payload.self.board));
      setLatestRender(payload);

      scoreRef.current = payload.self.score;
    };

    const onWin = () => {
      setGameOutcome("win");

      goTo(ROUTES.SCORE, {
        state: {
          score: scoreRef.current,
          result: "win",
          matchHistory: ["win vs A", "lose vs B"],
        },
      });
    };

    const onLose = () => {
      setGameOutcome("lose");

      goTo(ROUTES.SCORE, {
        state: {
          score: scoreRef.current,
          result: "lose",
          matchHistory: ["win vs A", "lose vs B"],
        },
      });
    };

    socket.on("game:render", onRender);
    socket.on("game:win", onWin);
    socket.on("game:lose", onLose);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("game:render", onRender);
      socket.off("game:win", onWin);
      socket.off("game:lose", onLose);
    };
  }, [socket, dispatch, username]);

  return (
    <div className="game-page">
      <div className="game-layout">
        {(() => {
          const opponents = latestRender?.opponents ?? {};

          const opponentEntries = Object.entries(opponents).filter(
            ([, opponent]) =>
              !!getOpponentBoard(opponent as OpponentEntry | undefined),
          );

          const opponentUsernames = opponentEntries.map(
            ([opponentUsername]) => opponentUsername
          );

          const midPoint = Math.floor(opponentUsernames.length / 2);
          const leftOpponents = opponentUsernames.slice(0, midPoint);
          const rightOpponents = opponentUsernames.slice(midPoint);

          return (
            <>
              <div className="game-header">
                <h1>RedTetris</h1>
              </div>

              <div className="game-board-container">
                <div className="opponents-column">
                  {leftOpponents.map((u) => {
                    const opponent = opponents[u] as OpponentEntry | undefined;
                    const board = getOpponentBoard(opponent);
                    return (
                      <div key={u} className="opponent-section">
                        <h3>{u}</h3>
                        {board ? <GameBoard board={board} /> : null}
                      </div>
                    );
                  })}
                </div>

              <div className="player-section">
                <h2>{username}</h2>
                <div className="player-info">
                  {latestRender?.self?.score !== null && latestRender?.self?.score !== undefined ? (
                    <div className="score-display">
                      Score: {latestRender.self.score}
                    </div>
                  ) : null}
                  <NextPieces nextPieces={latestRender?.self?.next_piece_types ?? null} />
                </div>
                {latestRender?.self?.hold_piece_type !== undefined && (
                  <div className="next-pieces">
                    <p className="next-pieces-label">Hold</p>
                    <div className="next-pieces-container">
                      <div className="next-piece">
                        <PiecePreview pieceType={latestRender.self.hold_piece_type} />
                      </div>
                    </div>
                  </div>
                )}
                <GameBoard board={latestRender?.self?.board ?? null} />
              </div>

                <div className="opponents-column">
                  {rightOpponents.map((u) => {
                    const opponent = opponents[u] as OpponentEntry | undefined;
                    const board = getOpponentBoard(opponent);
                    return (
                      <div key={u} className="opponent-section">
                        <h3>{u}</h3>
                        {board ? <GameBoard board={board} /> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {gameOutcome === null && <InputHandler />}

      {gameOutcome !== null && (
        <div className="game-outcome">
          <h2>{gameOutcome === "win" ? "YOU WIN" : "YOU LOSE"}</h2>
        </div>
      )}
      <div className="game-controls">
        <button onClick={onQuit}>Quit</button>
        <LogoutButton />
      </div>
    </div>
  );
}
