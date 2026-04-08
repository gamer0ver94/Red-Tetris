export class Player {
    private player_id: string
    private username: string
    private state: string
    private sid: string
    private socket_id: string
    private created_at: string
    private csrf_token: string

    constructor(
        player_id: string,
        username: string,
        state: string,
        sid: string,
        socket_id: string,
        created_at: string,
        csrf_token: string,
    ) {
        this.player_id = player_id
        this.username = username
        this.state = state
        this.sid = sid
        this.socket_id = socket_id
        this.created_at = created_at
        this.csrf_token = csrf_token
    }

    public get_player_id(): string {
        return this.player_id
    }

    public get_username(): string {
        return this.username
    }

    public get_state (): string {
        return this.state
    }

    public get_sid(): string {
        return this.sid
    }

    public get_socket(): string {
        return this.socket_id
    }

    public get_csrf_token(): string {
        return this.csrf_token
    }

    public set_state(newState: string): void {
        this.state = newState
    }

    public set_socket(newSocket: string): void {
        this.socket_id = newSocket
    }
}