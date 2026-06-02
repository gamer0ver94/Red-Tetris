# Implementing Tetris in React Client with Redux (No Canvas, No DOM Manipulation)

This guide explains how to implement a fully functional Tetris game in your React client using **only Redux for state management** and **pure CSS Grid for rendering**. No Canvas API, no direct DOM manipulation. Everything is declarative through Redux state → React components → CSS.

Perfect for your existing setup with `store.ts`, `userSlice.ts`, `reduxHooks.ts`, `Board.tsx`, `Cell.tsx`, and socket integration.

## 🎯 Key Principles (Client-Only Rendering)
1. **Redux stores server-sent game state** - board, pieces, score from server
2. **React components render Redux state declaratively**
3. **CSS Grid for board** - 10x20 cells with server-provided colors
4. **Keyboard sends inputs to server** via socket (no local logic)
5. **No Canvas** - CSS Grid/Flexbox only
6. **Server-authoritative** - all logic (collision, rotation, lines) on server

## 📊 Redux Store Structure

Create `tetrisSlice.ts` in `src/client/store/`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Tetromino {
  shape: number[][]; // 4x4 matrix representing piece
  color: string;
  x: number;
  y: number;
}

interface TetrisState {
  board: string[][]; // 20x10 grid, null | color
  currentPiece: Tetromino | null;
  nextPiece: Tetromino;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

const tetrominos = {
  I: { shape: [['I','I','I','I']], color: '#00F0F0' },
  O: { shape: [['O','O'],['O','O']], color: '#F0F000' },
  T: { shape: [[' ','T',' '],['T','T','T']], color: '#A000F0' },
  // ... L, J, S, Z
};

const initialState: TetrisState = {
  board: Array(20).fill().map(() => Array(10).fill(null)),
  currentPiece: null,
  nextPiece: getRandomTetromino(),
  score: 0,
  lines: 0,
  level: 1,
  gameOver: false,
  isPaused: false,
};

const tetrisSlice = createSlice({
  name: 'tetris',
  initialState,
  reducers: {
    setGameState: (state, action: PayloadAction<TetrisState>) => {
      return { ...state, ...action.payload }; // Replace entire state from server
    },
    sendInput: () => {
      // No-op reducer, just for dispatching input events
    },
  },
});

export const actions = tetrisSlice.actions;
export default tetrisSlice.reducer;
```

Add to `store.ts`:
```typescript
import tetrisReducer from './tetrisSlice';
const store = configureStore({
  reducer: {
    user: userReducer,
    tetris: tetrisReducer, // Add this
  },
});
```

## 🎮 React Components (Pure Rendering - Server State Only)

**Cell.tsx** (update existing):
```tsx
interface CellProps {
  color: string | null;
}
export const Cell: React.FC<CellProps> = ({ color }) => (
  <div 
    className="cell"
    style={{ 
      backgroundColor: color || 'transparent',
      border: '1px solid #333'
    }}
  />
);
```

**Board.tsx** (update existing):
```tsx
import { useSelector } from '../../hooks/reduxHooks';
import { Cell } from './Cell';

export const Board: React.FC = () => {
  const { board, currentPiece } = useSelector(state => state.tetris);

  // Render server-provided merged board directly (server handles piece overlay)
  const displayBoard = board;

  return (
    <div className="tetris-board">
      {displayBoard.map((row, y) => (
        <div key={y} className="row">
          {row.map((color, x) => (
            <Cell key={x} color={color} />
          ))}
        </div>
      ))}
    </div>
  );
};
```

**Game.tsx** (update existing):
```tsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from '../../hooks/reduxHooks';
import { sendInput } from '../store/tetrisSlice';
import { useSocket } from '../../socket/socketContext';
import { Board } from '../components/Board';
import { NextPiece } from './NextPiece';

export const Game: React.FC = () => {
  const dispatch = useDispatch();
  const { gameOver, isPaused, score } = useSelector(state => state.tetris);

  const socket = useSocket();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isPaused) return;
      
      let input: string;
      switch(e.code) {
        case 'ArrowLeft': input = 'left'; break;
        case 'ArrowRight': input = 'right'; break;
        case 'ArrowDown': input = 'down'; break;
        case 'ArrowUp': input = 'rotate'; break;
        case 'Space': input = 'drop'; break;
        case 'KeyP': input = 'pause'; break;
        default: return;
      }
      
      // Send input to server immediately
      socket.emit('playerInput', { input, gameId: 'your-game-id' });
      dispatch(sendInput()); // Optional local action
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, gameOver, isPaused, socket]);

  // No local game loop - server sends state updates

  if (gameOver) return <div>Game Over! Score: {score}</div>;

  return (
    <div className="game-container">
      <div className="main-game">
        <Board />
      </div>
      <div className="sidebar">
        <div>Score: {score}</div>
        <NextPiece />
        <button onClick={() => dispatch(pause())}>Pause</button>
      </div>
    </div>
  );
};
```

## 🎨 CSS (No Canvas!)

```css
/* src/client/App.css or Game.css */
.tetris-board {
  display: grid;
  grid-template-rows: repeat(20, 25px);
  grid-template-columns: repeat(10, 25px);
  gap: 1px;
  background: #000;
  padding: 10px;
  border: 2px solid #333;
  width: 260px;
  height: 520px;
}

.row {
  display: contents;
}

.cell {
  width: 25px;
  height: 25px;
  box-shadow: inset 1px 1px 0 rgba(255,255,255,0.3);
}

/* Piece drop shadow effect */
.cell[style*="background-color"] {
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
```

## 🔌 Socket Integration (Multiplayer)

**Server sends game state updates (~60fps or delta):**

```typescript
// socketContext or Game.tsx
useEffect(() => {
  socket.on('gameStateUpdate', (data: TetrisState) => {
    dispatch(setGameState(data)); // Update Redux from server
  });
  
  socket.on('opponentState', (data) => {
    dispatch(setOpponentState(data));
  });
  
  return () => {
    socket.off('gameStateUpdate');
    socket.off('opponentState');
  };
}, [dispatch]);

// Client only sends inputs
socket.emit('playerInput', { input: 'left', timestamp: Date.now() });
```


## 🚀 Quick Start Steps (Client-Side Only)

1. **Create `src/client/store/tetrisSlice.ts`** with server-state reducer
2. **Add `tetris: tetrisReducer`** to `store.ts`
3. **Update `Board.tsx`** to render server board state
4. **Update `Game.tsx`** with input → socket emit
5. **Add socket listeners** for `gameStateUpdate`
6. **Style CSS Grid** 
7. **Server needs**: game logic + broadcast state to clients

**Test**: `npm run dev` → join game → keyboard sends inputs, server updates state

## 📈 Performance Tips
- `useSelector` with shallow equality checks
- Server sends delta updates when possible
- Input buffering + prediction (advanced)
- CSS Grid handles 10x20 effortlessly

## 🎮 Client Flow
```
Keyboard → socket.emit('input') → Server processes → socket.emit('state') 
→ dispatch(setGameState) → Redux → React re-render → CSS Grid
```

**Pure client rendering + inputs. Server authoritative. Perfect for multiplayer Tetris!**

**Client files: ~150 LOC**

