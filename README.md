# Battleship Game

WebSocket-based multiplayer battleship game.

## Installation

```bash
npm install
npm start
```

Server will run on `http://localhost:3000`

## Game Flow

### 1. Registration
Both players register with name and password

### 2. Create Room
First player creates a room

Second player joins the room

### 3. Place Ships
Both players place their ships on the board

Game starts automatically when both players are ready.

### 4. Battle
Players take turns attacking

Rules:
- If you hit enemy ship, you get another turn
- If you miss, turn passes to opponent
- First player to destroy all enemy ships wins

### 5. Game End
When all ships are destroyed, game ends and winner is announced.

## Bot Mode

You can play against bot by creating a bot game instead of regular room.
Bot will automatically place ships and make moves.
