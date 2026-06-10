import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { setBoard } from "../store/gameSlice";
import { socketContext } from "../socket/socketContext";
import GameBoard from "../components/game/Board";

import { InputHandler } from "../components/game/InputHandler";
import type { RenderPayload } from "../Types/RenderPayload";

type OpponentEntry = RenderPayload["opponents"][string];

function getOpponentBoard(opponent: OpponentEntry | undefined | null) {
  if (!opponent) return null;
  if ("board" in opponent) return (opponent as any).board ?? null;
  return null;
}

export default function GamePage() {
  const socket = useContext(socketContext);
  const dispatch = useAppDispatch();
  const goTo = useNavigate();

  const username = useAppSelector((state: any) => state.user?.username ?? "");

  const [latestRender, setLatestRender] = useState<RenderPayload | null>(null);
  const [gameOutcome, setGameOutcome] = useState<"win" | "lose" | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onRender = (payload: RenderPayload) => {
      dispatch(setBoard(payload.self.board));
      console.log("Received render payload:", payload);

      setLatestRender(payload);
    };

    const onWin = () => {
      setGameOutcome("win");
      console.log("[socket] game ended: win");
    };

    const onLose = () => {
      setGameOutcome("lose");
      console.log("[socket] game ended: lose");
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
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 24,
          padding: 24,
          flexWrap: "wrap",
        }}
      >
        {(() => {
          const opponents = latestRender?.opponents ?? {};

          const opponentEntries = Object.entries(opponents).filter(
            ([, opponent]) => !!getOpponentBoard(opponent as OpponentEntry | undefined),
          );

          const allUsernames = [
            ...opponentEntries.map(([opponentUsername]) => opponentUsername),
            username,
          ];

          const centerIndex = Math.floor(allUsernames.length / 2);

          const before = allUsernames.slice(0, centerIndex);
          const after = allUsernames.slice(centerIndex + 1);

          return (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {before.map((u) => {
                  const opponent = opponents[u] as OpponentEntry | undefined;
                  const board = getOpponentBoard(opponent);
                  return (
                    <div key={u} style={{ minWidth: 120 }}>
                      <div>{u}</div>
                      {board ? <GameBoard board={board} /> : null}
                    </div>
                  );
                })}
              </div>

              <div>
                {before.map((u) => {
                  const opponent = opponents[u] as OpponentEntry | undefined;
                  const board = getOpponentBoard(opponent);
                  return (
                    <div key={u} style={{ minWidth: 420 }}>
                      <div>{u}</div>
                      {board ? <h1 style={{ color: "white" }}>{String(board)}</h1> : null}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div>{username}</div>
                <GameBoard board={latestRender?.self?.board ?? null} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {after.map((u) => {
                  const opponent = opponents[u] as OpponentEntry | undefined;
                  const board = getOpponentBoard(opponent);
                  return (
                    <div key={u} style={{ minWidth: 420 }}>
                      <div>{u}</div>
                      {board ? <GameBoard board={board} /> : null}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {gameOutcome === null && <InputHandler />}

      {gameOutcome !== null && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div>{gameOutcome === "win" ? "YOU WIN" : "YOU LOSE"}</div>
          <button onClick={() => goTo("/lobby")}>Return to Lobby</button>
        </div>
      )}
    </div>
  );
}

