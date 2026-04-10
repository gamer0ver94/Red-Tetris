export class Player {
    private player_id: string
    private username: string
    private player_status: string
    private sid: string
    private socket_id: string
    private created_at: string
    private csrf_token: string

    constructor(
        player_id: string,
        username: string,
        player_status: string,
        sid: string,
        socket_id: string,
        created_at: string,
        csrf_token: string,
    ) {
        this.player_id = player_id
        this.username = username
        this.player_status = player_status
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

    public get_player_status (): string {
        return this.player_status
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

    public set_player_status(new_status: string): void {
        this.player_status = new_status
    }

    public set_socket(new_socket: string): void {
        this.socket_id = new_socket
    }

}