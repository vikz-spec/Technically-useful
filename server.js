const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve index.html on "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// your socket.io logic here
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});

const lobbies = {};

const POWERS = [
    "Super strength",
    "Invisibility",
    "Teleportation",
    "Mind reading",
    "Super speed",
    "Flight",
    "Time stop",
    "Healing factor",
    "Shape-shifting",
    "Laser vision"
];

function randomPower() {
    return POWERS[Math.floor(Math.random() * POWERS.length)];
}

function generateCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on("connection", (socket) => {

    socket.on("createLobby", ({ username }) => {
        const code = generateCode();

        lobbies[code] = {
            hostId: socket.id,
            players: [{ id: socket.id, name: username, score: 0 }],
            turnIndex: 0,
            power: randomPower(),
            settings: {
                timer: 30,
                categories: ["Physical", "Mental", "Weird"]
            }
        };

        socket.join(code);
        socket.emit("lobbyCreated", { code });
        socket.emit("playerList", lobbies[code].players);
    });

    socket.on("joinLobby", ({ code, username }) => {
        const lobby = lobbies[code];
        if (!lobby) return;

        lobby.players.push({ id: socket.id, name: username, score: 0 });
        socket.join(code);

        io.to(code).emit("playerList", lobby.players);
        socket.emit("joinedLobby");
    });

    socket.on("updateSettings", ({ code, settings }) => {
        const lobby = lobbies[code];
        if (!lobby || lobby.hostId !== socket.id) return;
        lobby.settings = settings;
    });

    socket.on("startGame", (code) => {
        const lobby = lobbies[code];
        if (!lobby) return;

        lobby.turnIndex = 0;
        lobby.power = randomPower(); // ALWAYS regenerate here

        io.to(code).emit("gameStarted", {
            players: lobby.players,
            settings: lobby.settings,
            turnId: lobby.players[0].id,
            power: lobby.power
        });
    });

    socket.on("submitAnswer", ({ code }) => {
        const lobby = lobbies[code];
        if (!lobby) return;

        lobby.turnIndex++;

        if (lobby.turnIndex >= lobby.players.length) {
            lobby.turnIndex = 0;
            lobby.power = randomPower();

            io.to(code).emit("newRound", {
                power: lobby.power,
                turnId: lobby.players[0].id
            });
            return;
        }

        io.to(code).emit("nextTurn", lobby.players[lobby.turnIndex].id);
    });

    socket.on("chat", ({ code, user, message }) => {
        io.to(code).emit("chat", { user, message });
    });

    socket.on("disconnect", () => {
        for (const code in lobbies) {
            lobbies[code].players =
                lobbies[code].players.filter(p => p.id !== socket.id);
            io.to(code).emit("playerList", lobbies[code].players);
        }
    });
});

server.listen(3000, () =>
    console.log("Server running at http://localhost:3000")
);
