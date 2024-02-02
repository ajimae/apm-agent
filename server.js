const express = require("express");
const { stats } = require("./monitor");

const app = express();

// app.use(monitor({}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.get("/", function (req, res) {
  // fetch('https://youtube.com').then(data => data.text()).then(v => res.send(v)).catch(console.error);
  res.status(200).json({ message: "success" });
});

app.post('/status', stats());
app.get("/greet/:name", function (req, res) {
  res
    .status(200)
    .json({
      message: "status",
      data: {
        name: req.params.name,
        message: `Hello ${req.params.name}`,
      },
    });
});

app.listen(8080, function () {
  console.log(`listening on http://0.0.0.0:8080`);
});
