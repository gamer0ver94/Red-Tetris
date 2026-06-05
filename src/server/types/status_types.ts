export const gameStatusType = {

    created:'created',
    waiting:'waiting',
    started:'started',
    finish:'finish',

} as const;
export type GameStatus = typeof gameStatusType[keyof typeof gameStatusType ];

export const playerStatusType = {
    
    disconnected:'disconnected',
    connected:'connected',
    waiting_socket: 'waiting_socket',
    waiting: 'waiting',
    playing:'playing',
    ready:'ready',
}as const;
export type PlayerStatus = typeof playerStatusType[keyof typeof playerStatusType];
