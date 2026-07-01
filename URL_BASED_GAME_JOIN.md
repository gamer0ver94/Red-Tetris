# URL-Based Game Join Implementation Guide

## Overview

This document explains how to implement URL-based game joining in the Red-Tetris application, allowing players to join games via URLs like:
```
http://<server_name_or_ip>:<port>/<room>/<player_name>
```

Where:
- `room` = game_id (the unique identifier of the game lobby)
- `player_name` = username (the player's display name)

---

## Current System Architecture

### Server-Side Components

#### 1. **Fastify Server** (`src/server/index.ts`)
- Runs on port 1800 by default
- Uses Socket.IO for real-time communication
- Implements session-based authentication with cookies
- Supports CSRF protection

#### 2. **Game Routes** (`src/server/routes/game_routes.ts`)
The server already has a join endpoint:
```typescript
GET /join/:game_id/:username
```

This endpoint:
- Validates the user's session (SID from cookie)
- Verifies the username matches the authenticated user
- Checks if the game exists and is in "waiting" status
- Returns game details including player_id, csrf_token, and is_host status

#### 3. **Game Lobby Controller** (`src/server/controllers/game_lobby_controller.ts`)
The `get_join` function handles the join logic:
- Reads session ID from cookie
- Validates user exists and is known
- Ensures username matches authenticated user
- Verifies game is joinable (status = "waiting")
- Returns necessary data for lobby entry

### Client-Side Components

#### 1. **React Router** (`src/client/App.tsx`)
Current routes:
- `/` → RegisterPage
- `/home` → HomePage
- `/lobby` → LobbyPage
- `/game` → GamePage
- `/score` → ScorePage

#### 2. **HomePage** (`src/client/pages/HomePage.tsx`)
- Allows users to manually enter a game_id to join
- Has input field and "Join" button
- Calls `GET /join/:game_id/:username` endpoint

#### 3. **LobbyPage** (`src/client/pages/LobbyPage.tsx`)
- Displays lobby players
- Handles ready status
- Emits socket events for lobby actions
- Stores game_id in sessionStorage
- **This page will be enhanced to also handle URL-based joins**

---

## Implementation Strategy

### Approach: Enhance Existing LobbyPage (Recommended)

Since you already have a LobbyPage that handles game joining, the best approach is to **enhance the existing LobbyPage** to detect and process URL parameters automatically. This avoids code duplication and maintains a single source of truth for lobby logic.

#### Step 1: Add New Client Route

**File:** `src/client/Types/Routes.tsx`
```typescript
export const ROUTES = {
    REGISTER: '/register',
    HOME: '/home',
    LOBBY: '/lobby',
    GAME: '/game',
    SCORE: '/score',
    JOIN_GAME: '/join/:gameId/:playerName',  // Add this
} as const;
```

**File:** `src/client/App.tsx`
```typescript
import LobbyPage from './pages/LobbyPage';

<Routes>
    <Route path="/" element={<Navigate to={ROUTES.REGISTER} replace />} />
    <Route path={ROUTES.REGISTER} element={<RegisterPage/>}/>
    <Route path={ROUTES.HOME} element={<HomePage/>}/>
    <Route path={ROUTES.LOBBY} element={<LobbyPage/>}/>
    <Route path={ROUTES.JOIN_GAME} element={<LobbyPage/>}/>  {/* Reuse LobbyPage */}
    <Route path={ROUTES.GAME} element={<GamePage/>}/>
    <Route path={ROUTES.SCORE} element={<ScorePage/>}/>
</Routes>
```

**Key Insight:** Both `/lobby` and `/join/:gameId/:playerName` routes use the same `LobbyPage` component. The LobbyPage will detect which route was used and behave accordingly.

#### Step 2: Enhance LobbyPage to Handle URL Parameters

**File:** `src/client/pages/LobbyPage.tsx` (Modify existing file)

Add URL parameter detection and automatic join logic:

```typescript
import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";  // Add useParams
import { useAppSelector, useAppDispatch } from "../hooks/reduxHooks";
import { socketContext } from "../socket/socketContext";
import PlayerCard from "../components/cards/PlayerCard";
import {
  playerJoined,
  playerLeft,
} from "../store/lobbySlice";
import { ROUTES } from "../Types/Routes";
import "./LobbyPage.css";
import LogoutButton from "../components/LogoutButton";
import { config } from "../conf";
import { fetchData } from "../components/fetch/fetch";
import { setCsrfToken, setUsername } from "../store/userSlice";

type LobbyPlayer = {
  username: string;
  status: string;
  is_owner: boolean;
};

type JoinGameParams = {
  gameId?: string;
  playerName?: string;
};

export default function LobbyPage() {
  const dispatch = useAppDispatch();
  const goTo = useNavigate();
  
  // Add URL parameter detection
  const urlParams = useParams<JoinGameParams>();
  const isJoiningViaUrl = !!(urlParams.gameId && urlParams.playerName);

  const username = useAppSelector((state) => state.user.username) || "Player";
  const csrf_token = useAppSelector((state) => state.user.csrf_token);

  const socket = useContext(socketContext);

  const gameIdFromSession = sessionStorage.getItem("game_id") || "";

  const [hostUsername, setHostUsername] = useState<string>("");

  const [lobbyPlayers, setLobbyPlayers] = useState<Record<string, LobbyPlayer>>(
    {}
  );

  const [joinError, setJoinError] = useState<string>("");
  const [isJoining, setIsJoining] = useState(false);

  // ... rest of existing code (leaveLobby, onPlayerReady, startGame, etc.) ...

  // Add new useEffect for URL-based joining
  useEffect(() => {
    async function handleUrlJoin() {
      // Only process if we have URL parameters and aren't already in a game
      if (!isJoiningViaUrl || isJoining || gameIdFromSession) {
        return;
      }

      const { gameId, playerName } = urlParams;
      if (!gameId || !playerName) {
        return;
      }

      setIsJoining(true);
      setJoinError("");

      try {
        // Decode URL-encoded player name
        const decodedPlayerName = decodeURIComponent(playerName);

        // Construct join URL
        const joinUrl = `${config.joinLobby}/${gameId}/${decodedPlayerName}`;

        // Make API call to join the game
        const response = await fetchData(joinUrl, null, "GET");

        if (!response.success) {
          setJoinError(response.error || "Failed to join game via URL");
          setIsJoining(false);
          return;
        }

        // Store user data in Redux
        dispatch(setUsername(response.username));
        dispatch(setCsrfToken(response.csrf_token));

        // Store game_id in sessionStorage
        if (response.game_id) {
          sessionStorage.setItem("game_id", response.game_id);
        }

        // Connect socket with CSRF token
        socket.auth = { csrf_token: response.csrf_token };
        if (!socket.connected) {
          socket.connect();
        }

        // Socket connection and lobby setup will be handled by existing useEffect
      } catch (err) {
        setJoinError("An error occurred while joining the game");
        setIsJoining(false);
      }
    }

    handleUrlJoin();
  }, [isJoiningViaUrl, isJoining, gameIdFromSession, urlParams, dispatch, socket]);

  // ... rest of existing useEffect hooks ...

  // Modify the render to show join error/loading if present
  return (
    <div className="lobby-container">
      <h1>Lobby</h1>

      {/* Show join error if URL-based join failed */}
      {joinError && (
        <div className="error-message">
          <p>{joinError}</p>
          <button onClick={() => goTo(ROUTES.HOME)}>
            Return to Home
          </button>
        </div>
      )}

      {/* Show loading state for URL-based join */}
      {isJoining && !joinError && (
        <div className="loading-message">
          <p>Joining game...</p>
        </div>
      )}

      {/* Only show lobby content if not in error/loading state */}
      {!joinError && !isJoining && (
        <>
          <div className="lobby-players">
            <div className="oponent-players">
              {Object.entries(lobbyPlayers)
                .filter(([name]) => name !== username)
                .map(([name, player]) => (
                  <PlayerCard
                    key={name}
                    username={player.username}
                    isOwner={player.is_owner}
                    status={player.status}
                  />
                ))}
            </div>

            <div className="player">
              <PlayerCard
                username={username}
                isOwner={lobbyPlayers[username]?.is_owner ?? false}
                status={lobbyPlayers[username]?.status ?? "not-ready"}
                onReady={onPlayerReady}
                onReturn={leaveLobby}
              />
            </div>
          </div>

          <button onClick={startGame}>Start Game</button>
        </>
      )}

      <div className="logout-space">
        <div>{gameIdFromSession}</div>
        <LogoutButton />
      </div>
    </div>
  );
}
```

#### Step 3: Update Configuration

**File:** `src/client/conf.tsx`

Ensure the `joinLobby` configuration is properly set:
```typescript
export const config = {
    // ... existing config
    joinLobby: '/api/game/join',  // This should match the server route
    // ... other config
};
```

#### Step 4: Handle URL Generation on Server

When a game is created, the server should provide the join URL to the host.

**File:** `src/server/controllers/game_lobby_controller.ts`

Modify the `post_create` function to include the join URL:
```typescript
export async function post_create(
    request:FastifyRequest <{Body : {
        csrf_token: string,
        game_mode: string,
        options?:GameOptions
    } }>,
    reply:FastifyReply
){
    // ... existing code ...
    
    const response = game_services.create_game(
        request.server.store,
        sid,
        request.body.game_mode,
        request.body.options,
    );
    
    // ... existing code ...
    
    // Get server information for URL construction
    const host = request.hostname;
    const protocol = request.protocol;
    const port = request.server.listeningString?.split(':').pop() || '1800';
    const player = player_res.data;
    
    // Construct join URL
    const joinUrl = `${protocol}://${host}:${port}/join/${response.data}/${encodeURIComponent(player.username)}`;
    
    return reply.code(201).send({
        success: response.success,
        game_id: response.data,
        join_url: joinUrl,  // Add this field
    });
}
```

**File:** `src/server/routes/game_routes.ts`

Update the response schema to include the join URL:
```typescript
response: {
    201: {
        type: 'object',
        additionalProperties: false,
        required: ['success', 'game_id', 'join_url'],
        properties: {
            success: { type: 'boolean', const: true },
            game_id: { type: 'string' },
            join_url: { type: 'string' },
        }
    },
    // ... other responses
}
```

---

## Implementation Flow

### Complete User Journey

#### 1. **Game Creation Flow**
```
Host creates game
    ↓
POST /api/game/create
    ↓
Server creates lobby, returns game_id + join_url
    ↓
Host receives: {
    success: true,
    game_id: "abc123",
    join_url: "http://192.168.1.100:1800/join/abc123/PlayerOne"
}
    ↓
Host shares join_url with friends
```

#### 2. **Game Join Flow via URL**
```
Player clicks: http://server:1800/join/abc123/PlayerTwo
    ↓
Client routes to LobbyPage (same component as /lobby)
    ↓
LobbyPage detects URL parameters: gameId="abc123", playerName="PlayerTwo"
    ↓
GET /api/game/join/abc123/PlayerTwo
    ↓
Server validates:
    - Session exists (SID from cookie)
    - Username matches authenticated user
    - Game exists and is joinable
    ↓
Returns: {
    success: true,
    game_id: "abc123",
    player_id: "player_xyz",
    username: "PlayerTwo",
    csrf_token: "token_abc",
    game_status: "waiting",
    is_host: false
}
    ↓
Client stores data, connects socket
    ↓
Player appears in lobby (same LobbyPage UI)
```

---

## Security Considerations

### 1. **Session Validation**
- The join endpoint requires a valid session cookie (SID)
- Users must be registered/authenticated before joining
- Prevents anonymous access to games

### 2. **Username Matching**
- The URL parameter `player_name` must match the authenticated user's username
- Prevents identity spoofing
- Server validates: `user_res.data.username === username`

### 3. **CSRF Protection**
- CSRF token is returned and must be used for subsequent requests
- Socket connections require CSRF token in auth
- Prevents cross-site request forgery attacks

### 4. **URL Encoding**
- Player names with special characters must be URL-encoded
- Use `encodeURIComponent()` when generating URLs
- Use `decodeURIComponent()` when parsing URLs

### 5. **Game State Validation**
- Only games in "waiting" status can be joined
- Prevents joining started/finished games
- Returns 409 Conflict if game is not joinable

---

## Alternative Approaches

### Approach 2: Query Parameters

Instead of path parameters, use query strings:
```
http://server:1800/join?game=abc123&player=PlayerTwo
```

**Pros:**
- More flexible parameter handling
- Easier to add additional parameters

**Cons:**
- Less RESTful
- Longer URLs
- Less intuitive for users

### Approach 3: Hash-Based Routing

```
http://server:1800/#/join/abc123/PlayerTwo
```

**Pros:**
- Client-side only routing
- No server configuration needed

**Cons:**
- Requires client-side validation
- Less SEO-friendly
- URL is less clean

---

## Testing the Implementation

### 1. **Manual Testing**

Create a test game and share the URL:
```bash
# Start the server
npm run dev

# Create a game (as Player1)
POST http://localhost:1800/api/game/create
Body: { "game_mode": "classic" }

# Response:
{
    "success": true,
    "game_id": "game_123",
    "join_url": "http://localhost:1800/join/game_123/Player1"
}

# Share URL with Player2
# Player2 clicks: http://localhost:1800/join/game_123/Player2
```

### 2. **Automated Testing**

**Test Case 1: Valid Join via URL**
```typescript
test('should join game via URL and show lobby', async () => {
    const gameId = 'test_game_123';
    const playerName = 'TestPlayer';
    
    // Navigate to join URL
    await page.goto(`http://localhost:1800/join/${gameId}/${playerName}`);
    
    // Should show lobby (not redirect)
    await expect(page.locator('h1')).toContainText('Lobby');
    
    // Should show loading then players
    await expect(page.locator('text=Joining game...')).toBeVisible();
});
```

**Test Case 2: Invalid Game ID**
```typescript
test('should show error for invalid game', async () => {
    await page.goto('http://localhost:1800/join/invalid_game/Player');
    
    // Should show error message
    await expect(page.locator('text=Error Joining Game')).toBeVisible();
    await expect(page.locator('button')).toContainText('Return to Home');
});
```

**Test Case 3: Special Characters in Name**
```typescript
test('should handle special characters in player name', async () => {
    const playerName = encodeURIComponent('Player#1');
    await page.goto(`http://localhost:1800/join/game_123/${playerName}`);
    
    // Should successfully join
    await expect(page.locator('h1')).toContainText('Lobby');
});
```

---

## Deployment Considerations

### 1. **Reverse Proxy Configuration**

If using Nginx or similar, ensure the join route is properly proxied:

**Nginx Example:**
```nginx
location /join/ {
    proxy_pass http://localhost:1800/join/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 2. **Port Configuration**

The join URL includes the port number. For production:
- Use standard ports (80 for HTTP, 443 for HTTPS)
- Or configure reverse proxy to hide port

**Production URL Example:**
```
https://tetris.example.com/join/abc123/PlayerName
```

### 3. **Multi-Server Setup**

If running multiple game servers:
- Use a load balancer
- Implement sticky sessions
- Or use a centralized session manager (already supported via `SESSION_MANAGER` env var)

---

## Summary

### Key Changes Required

1. **Client-Side:**
   - Add new route: `/join/:gameId/:playerName`
   - Enhance existing `LobbyPage.tsx` to detect URL parameters
   - Automatically call join API when URL parameters are present
   - Handle loading/error states within LobbyPage
   - **No new page component needed - reuse existing LobbyPage**

2. **Server-Side:**
   - Modify `post_create` to return `join_url`
   - Update response schema to include `join_url`
   - No changes needed to existing `get_join` endpoint

3. **Benefits:**
   - Seamless user experience
   - Easy game sharing
   - No manual game ID entry required
   - Maintains all security validations
   - **No code duplication - single LobbyPage component**

### Files to Modify

| File | Changes |
|------|---------|
| `src/client/Types/Routes.tsx` | Add `JOIN_GAME` route |
| `src/client/App.tsx` | Add route pointing to existing LobbyPage |
| `src/client/pages/LobbyPage.tsx` | **Enhance existing file** with URL parameter handling |
| `src/server/controllers/game_lobby_controller.ts` | Add `join_url` to response |
| `src/server/routes/game_routes.ts` | Update response schema |

### Backward Compatibility

- Existing manual join via HomePage still works
- Direct `/lobby` route still works
- No breaking changes to existing API
- New URL-based join is additive functionality

---

## Conclusion

This implementation provides a user-friendly way to join games via direct URLs while maintaining the security and validation of the existing system. The approach leverages the existing `/join/:game_id/:username` endpoint and **reuses the existing LobbyPage component**, requiring minimal changes and avoiding code duplication.

The URL format `http://<server>:<port>/<room>/<player_name>` is intuitive for users and easy to share, making game joining as simple as clicking a link.

**Key Advantage:** Instead of creating a new JoinGamePage component, we enhance the existing LobbyPage to handle both manual joins (via `/lobby`) and URL-based joins (via `/join/:gameId/:playerName`), maintaining a single source of truth for lobby functionality.