// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let clients = {};
let gameState = {
    player1: { team: [], positions: {} },
    player2: { team: [], positions: {} },
    turn: "player1",
    board: Array(5).fill().map(() => Array(5).fill(""))
};

function validateMove(player, move) {
    // Simple validation logic (can be expanded)
    const [character, direction] = move.split(":");
    return true; // Assuming move is valid for simplicity
}

function updateGameState(player, move) {
    const [character, direction] = move.split(":");
    // Update game state based on the move (needs proper implementation)
    gameState.turn = player === "player1" ? "player2" : "player1";
}

function broadcast(message) {
    Object.values(clients).forEach(client => client.send(message));
}

wss.on('connection', (ws) => {
    let playerId = Object.keys(clients).length === 0 ? 'player1' : 'player2';
    clients[playerId] = ws;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'setup') {
            gameState[playerId].team = data.team;
            gameState[playerId].positions = data.team.reduce((acc, char, i) => {
                acc[char] = { x: i, y: playerId === 'player1' ? 0 : 4 };
                return acc;
            }, {});
            if (gameState.player1.team.length && gameState.player2.team.length) {
                broadcast(JSON.stringify({ type: 'start', state: gameState }));
            }
        }

        if (data.type === 'move') {
            if (playerId === gameState.turn && validateMove(playerId, data.move)) {
                updateGameState(playerId, data.move);
                broadcast(JSON.stringify({ type: 'update', state: gameState }));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid move or not your turn' }));
            }
        }
    });

    ws.on('close', () => {
        delete clients[playerId];
    });
});

console.log('WebSocket server started on ws://localhost:8080');
