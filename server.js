const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("SERVER IS RESPONDING");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Listening on port", PORT);
});
