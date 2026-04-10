import { createSlice, configureStore } from '@reduxjs/toolkit'
import pieces from '../utils/pieces'

const p = [
    pieces.I,
    pieces.O,
    pieces.T,
    pieces.S,
    pieces.Z,
    pieces.J,
    pieces.L
]

function getRandomPiece() {
  return p[Math.floor(Math.random() * p.length)]
}
const gameSlice = createSlice({
  name: 'tetris',
  initialState: {
    score: 0,
    linesCleared: 0,
    isGameOver: false,
    currentPiece: null as number[][] | null,
    position: { x: 4, y: 0 },
    nextPiece: null as number[][] | null,
    board: Array.from({ length: 20 }, () =>
        Array(10).fill(0))
  },

  reducers: {
    startGame(state) {
      state.score = 0
      state.linesCleared = 0
      state.isGameOver = false
      state.currentPiece = getRandomPiece()
      state.nextPiece = getRandomPiece()
      state.position = { x: 4, y: 0 }
      state.board = Array.from({ length: 20 }, () =>
        Array(10).fill(0)
)
    },
    movePiece(state, action) {
      // Logic to move the current piece based on the action payload
    },
    rotatePiece(state) {
      // Logic to rotate the current piece
    },
    clearLines(state) {
      // Logic to clear completed lines and update score and level
    },
    gameOver(state) {
      state.isGameOver = true
    },
    dropPiece(state) {
        if (!state.currentPiece) return

  // move piece down
  state.position.y += 1

  // if it reaches bottom → reset
 if (state.position.y > 18) {
  state.currentPiece = state.nextPiece
  state.nextPiece = getRandomPiece()
  state.position = { x: 4, y: 0 }
}
}
  }
})

export const { startGame, movePiece, rotatePiece, dropPiece, clearLines, gameOver } = gameSlice.actions

const store = configureStore({
  reducer: {
    game: gameSlice.reducer
  }
})

export default store
