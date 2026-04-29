export default function Board() {
    type Cell = 0 | 1; // empty or filled

    const createBoard = (rows: number, cols: number): Cell[][] =>
        Array.from({ length: rows }, () => Array(cols).fill(0));
    return (
        <div>
            <h1>Board</h1>
        </div>
    )
}