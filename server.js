const express = require("express");
const app = express();

app.get("/", (req, res) => {
<<<<<<< HEAD
    res.send("SERVER IS RESPONDING");
=======
  res.send("SERVER IS RESPONDING");
>>>>>>> fa377554862a6fdb43a4ad673de797d2a04107b1
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
<<<<<<< HEAD
    console.log("Listening on port", PORT);
=======
  console.log("Listening on port", PORT);
>>>>>>> fa377554862a6fdb43a4ad673de797d2a04107b1
});
