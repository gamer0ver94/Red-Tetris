import "../components/CustomOptionForm.css";

export type GameOptions = {
  grid: {
    width: number;
    height: number;
    invisible: boolean;
    revealOnClearMs: number;
  };

  pieces: {
    randomSequence: boolean;
    sharedSequence: boolean;
    allowHold: boolean;
    nextPreviewCount: number;
  };

  gravity: {
    tickMs: number;
    lockDelayMs: number;
    maxLock: number;
    softDropMultiplier: number;
    fallAfterClear: boolean;
    speedOnLock: boolean;
  };

  garbage: {
    enabled: boolean;
    canClear: boolean;
    ratio: number;
    clearCreateGarbage: boolean;
  };

  scoring: {
    enabled: boolean;
    backToBackBonus: boolean;
  };

  win: {
    condition: 'survival'|'first_lost'|'score'|'lines'|'time';
    limit: number | null;
  };

  multiplayer: {
    enabled: boolean;
    maxPlayers: number | null;
    seeOpponents: "full" | "grid" | "highest" | "none";
  };
};

type Props = {
  options: GameOptions;
  setOptions: React.Dispatch<React.SetStateAction<GameOptions>>;
};

export default function CustomOptionForm({
  options,
  setOptions,
}: Props) {
  return (
    <div className="custom neon">
      {(Object.keys(options) as (keyof GameOptions)[]).map(
        (sectionKey) => {
          const sectionValue = options[sectionKey];

          return (
            <div key={sectionKey} className="section">
              <h3>{sectionKey}</h3>

              {(Object.keys(
                sectionValue
              ) as (keyof typeof sectionValue)[]).map((fieldKey) => {
                const fieldValue = sectionValue[fieldKey];
                return (
                  <div key={fieldKey} className="field">
                    <label>{fieldKey}</label>

                    {typeof fieldValue === "boolean" && (
                      <input
                        type="checkbox"
                        checked={fieldValue}
                        onChange={(e) => {
                          setOptions((prev) => ({
                            ...prev,
                            [sectionKey]: {
                              ...prev[sectionKey],
                              [fieldKey]: e.target.checked,
                            },
                          }));
                        }}
                      />
                    )}
                    {typeof fieldValue === "number" && (
                      <input
                        type="number"
                        value={fieldValue}
                        onChange={(e) => {
                          setOptions((prev) => ({
                            ...prev,
                            [sectionKey]: {
                              ...prev[sectionKey],
                              [fieldKey]: Number(e.target.value),
                            },
                          }));
                        }}
                      />
                    )}
                    {sectionKey === "multiplayer" &&
                      fieldKey === "seeOpponents" && (
                        <select
                          value={fieldValue}
                          onChange={(e) => {
                            setOptions((prev) => ({
                              ...prev,
                              multiplayer: {
                                ...prev.multiplayer,
                                seeOpponents:
                                  e.target.value as any,
                              },
                            }));
                          }}
                        >
                          <option value="full">full</option>
                          <option value="grid">grid</option>
                          <option value="highest">highest</option>
                          <option value="none">none</option>
                        </select>
                      )}
                  </div>
                );
              })}
            </div>
          );
        }
      )}
    </div>
  );
}