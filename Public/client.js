const socket = io();

const usernameInput = document.getElementById("username");
const codeInput = document.getElementById("codeInput");
const answer = document.getElementById("answer");
const chat = document.getElementById("chat");
const scoreboard = document.getElementById("scoreboard");
const powerText = document.getElementById("power");

let lobbyCode = "";
let myUsername = "";
let isMyTurn = false;

function showRoom(id) {
    ["home-room", "settings-room", "game-room"].forEach(r => {
        document.getElementById(r).hidden = r !== id;
    });
}

document.getElementById("create").onclick = () => {
    const username = usernameInput.value.trim();
    if (!username) return alert("Username required");
    myUsername = username;
    socket.emit("createLobby", { username });
};

document.getElementById("join").onclick = () => {
    const username = usernameInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();
    if (!username || !code) return alert("Missing info");
    myUsername = username;
    lobbyCode = code;
    socket.emit("joinLobby", { code, username });
};

document.getElementById("start").onclick = () => {
    const categories = [...document.querySelectorAll("#categories input:checked")]
        .map(c => c.value);

    const timer = +document.getElementById("timer").value;

    socket.emit("updateSettings", {
        code: lobbyCode,
        settings: { categories, timer }
    });

    socket.emit("startGame", lobbyCode);
};

document.getElementById("submit").onclick = () => {
    if (!isMyTurn) return;
    socket.emit("submitAnswer", { code: lobbyCode });
    answer.value = "";
};

socket.on("lobbyCreated", ({ code }) => {
    lobbyCode = code;
    showRoom("settings-room");
});

socket.on("joinedLobby", () => showRoom("game-room"));

socket.on("playerList", players => {
    scoreboard.innerHTML = players
        .map(p => `<li>${p.name}: ${p.score}</li>`)
        .join("");
});

socket.on("gameStarted", ({ settings, turnId, power }) => {
    if (power) {
        powerText.textContent = `🧩 Power: ${power}`;
    }
    updateTurn(turnId);
    startTimer(settings.timer);
    showRoom("game-room");
});

socket.on("newRound", ({ power, turnId }) => {
    if (power) {
        powerText.textContent = `🧩 Power: ${power}`;
    }
    updateTurn(turnId);
});

socket.on("nextTurn", id => updateTurn(id));

socket.on("chat", ({ user, message }) => {
    chat.innerHTML += `<div><b>${user}:</b> ${message}</div>`;
    chat.scrollTop = chat.scrollHeight;
});

function updateTurn(id) {
    isMyTurn = socket.id === id;
    document.getElementById("turn").textContent =
        isMyTurn ? "🟢 Your turn" : "⏳ Waiting...";
}

function startTimer(seconds) {
    const bar = document.getElementById("timerBar");
    let remaining = seconds;
    bar.style.width = "100%";

    const interval = setInterval(() => {
        remaining--;
        bar.style.width = (remaining / seconds) * 100 + "%";
        if (remaining <= 0) clearInterval(interval);
    }, 1000);
}

document.getElementById("chatInput").addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.value.trim()) {
        socket.emit("chat", {
            code: lobbyCode,
            user: myUsername,
            message: e.target.value
        });
        e.target.value = "";
    }
});
