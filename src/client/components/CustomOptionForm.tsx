import "../components/CustomOptionForm.css";

export type GameOptions = {
  grid: {
    width: number;
    height: number;
    invisible: boolean;
    revealOnClearMs: number;
    showLockHighlight: boolean;
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

type NumberRange = {
    min?:number,
    max?:number,
    step?:number
};

const NUMBER_RANGES:Partial<{
    [Section in keyof GameOptions]: Partial<
        Record<keyof GameOptions[Section], NumberRange|undefined>
    >;
}> = {
    grid:{
        width: {min: 4, max: 30, step: 1},
        height: {min: 10, max: 40, step: 1},
        revealOnClearMs: {min: 0, max: 1000, step: 10},
    },
    pieces:{
        nextPreviewCount: {min: 0, max: 7, step: 1},
    },
    gravity:{
        tickMs: {min: 150, max: 2000, step: 50},
        lockDelayMs: {min: 0, max: 1000, step: 10},
        maxLock: {min: 0, max: 20, step: 1},
        softDropMultiplier: {min: 0.1, max: 1, step: 0.05},
    },
    garbage:{
        ratio: {min: 0, max: 5, step: 0.1}, 
    },
    win:{
        limit: {min: 0, max: 10000, step: 1}
    },
    multiplayer:{}
};

const NULLABLE_FIELDS = new Set([
  "win.limit",
  "multiplayer.maxPlayers",
]);

const isNullableNumber = (sectionKey: string, fieldKey:string) =>
  NULLABLE_FIELDS.has(`${sectionKey}.${fieldKey}`);

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

              {(Object.keys(sectionValue) as string[]).map((fieldKey) => {
                const fieldValue = sectionValue[fieldKey as keyof typeof sectionValue];
                const range = (NUMBER_RANGES[sectionKey as keyof typeof NUMBER_RANGES] as Record<string, NumberRange> | undefined)?.[fieldKey];
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
                    {(typeof fieldValue === "number" || isNullableNumber(sectionKey, fieldKey)) && (
                      <input
                        type="number"
                        min={range?.min}
                        max={range?.max}
                        step={range?.step}
                        value={fieldValue ?? 0}
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
                      {/*START: ADDEDBY YSEBBAN TO TEST CUSTOM END GAME */}
                      {sectionKey === "win" &&
                      fieldKey === "condition" && (
                        <select
                          value={fieldValue}
                          onChange={(e) => {
                            setOptions((prev) => ({
                              ...prev,
                              win: {
                                ...prev.win,
                                condition:
                                  e.target.value as GameOptions["win"]["condition"],
                              },
                            }));
                          }}
                        >
                          <option value="survival">survival</option>
                          <option value="first_lost">first_lost</option>
                          <option value="score">score</option>
                          <option value="lines">lines</option>
                          <option value="time">time</option>
                        </select>
                      )}
                      {/*END: ADDEDBY YSEBBAN TO TEST CUSTOM END GAME */}
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
