import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { HistoryEntry } from "../types/history_types.js";

export class HistoryProvider{

    private static readonly default_start = 0;
    private static readonly default_end = 10;

    private static get path(): string {
        return process.env.HISTORY_PATH ?? '/app/history.json';
    }


    public static read_history():HistoryEntry[]{
        if(!existsSync(this.path))
            return [];

        try {
            const raw = readFileSync(this.path, 'utf8').trim();
            if(raw.length === 0)
                return [];

            const parsed:unknown = JSON.parse(raw);
            if(!Array.isArray(parsed))
                return [];

            return parsed.filter(this.is_history_entry);
        }
        catch {
            return [];
        }
    }

    private static write_history(history:HistoryEntry[]):boolean{
        try {
            writeFileSync(this.path, `${JSON.stringify(history, null, 2)}\n`, 'utf8');
            return true;
        }
        catch {
            return false;
        }
    }

    private static slice_history(
        history:HistoryEntry[],
        start = this.default_start,
        end = this.default_end,
    ):HistoryEntry[]{
        const safe_start = Math.max(0, start);
        const safe_end = Math.max(safe_start, end);

        return history.slice(safe_start, safe_end);
    }

    public static add_entry(entry:HistoryEntry):boolean{
        const history = this.read_history();
        const updated = [entry, ...history];

        return this.write_history(updated);
    }

    public static get_history_by_date(newer_first:boolean, start = this.default_start, end = this.default_end):HistoryEntry[]{
        const history = this.read_history();

        return this.slice_history(
            history.sort((a, b) => {
                const a_time = Date.parse(a.end_date);
                const b_time = Date.parse(b.end_date);
                return newer_first ? b_time - a_time : a_time - b_time;
            }),
            start,
            end,
        );
    }

    public static get_history_by_score(start = this.default_start, end = this.default_end):HistoryEntry[]{
        const history = this.read_history();

        return this.slice_history(
            history
            .filter((entry) => !entry.is_hidden)
            .sort((a, b) => b.score - a.score),
            start,
            end,
        );
    }

    public static get_history_by_username(username:string, start = this.default_start, end = this.default_end):HistoryEntry[]{
        const history = this.read_history();

        return this.slice_history(
            history.filter((entry) => entry.username === username),
            start,
            end,
        );
    }

    public static get_history_by_mode(mode:string, start = this.default_start, end = this.default_end):HistoryEntry[]{
        const history = this.read_history();

        return this.slice_history(
            history.filter((entry) => entry.game_mode === mode),
            start,
            end,
        );
    }

    public static get_history_by_lobby_id(lobby_id:string, start = this.default_start, end = this.default_end):HistoryEntry[]{
        const history = this.read_history();

        return this.slice_history(
            history.filter((entry) => entry.lobby_id === lobby_id),
            start,
            end,
        );
    }

    public static get_history_by_win(start = this.default_start, end = this.default_end):HistoryEntry[]{
        const history = this.read_history();

        return this.slice_history(
            history.filter((entry) => entry.is_winner),
            start,
            end,
        );
    }

    public static get_history_by_lose(start = this.default_start, end = this.default_end):HistoryEntry[]{
        const history = this.read_history();

        return this.slice_history(
            history.filter((entry) => !entry.is_winner),
            start,
            end,
        );
    }

    public static search_username_in_history(
        query:string,
        start = this.default_start,
        end = this.default_end,
    ):UsernameSearchHistoryData[]{

        const grouped = new Map<string, HistoryEntry[]>();

        if(query.length == 0)
            return [];

        for(const entry of this.read_history()){
            const username = entry.username;

            if(!username.includes(query))
                continue;
            const entries = grouped.get(username) ?? [];
            entries.push(entry);
            grouped.set(username, entries);
        }
        return [...grouped.entries()]
            .sort(([a] , [b]) => a.localeCompare(b))
            .map(([username, entries]) => ({
                username,
                entries: this.slice_history(entries, start, end),
            }));
    }

    private static is_history_entry(value:unknown):value is HistoryEntry{
        if(!value || typeof value !== 'object')
            return false;

        const entry = value as Partial<HistoryEntry>;

        return (
            typeof entry.username === 'string' &&
            typeof entry.is_winner === 'boolean' &&
            typeof entry.score === 'number' &&
            typeof entry.is_hidden === 'boolean' &&
            typeof entry.game_mode === 'string' &&
            typeof entry.total_time === 'string' &&
            typeof entry.end_date === 'string' &&
            typeof entry.lobby_id === 'string'
        );
    }
}

export type UsernameSearchHistoryData = {
    username:string;
    entries:HistoryEntry[];
};
