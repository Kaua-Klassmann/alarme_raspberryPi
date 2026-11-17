import express from "express";
import cors from "cors";
import fs from "node:fs/promises";

let state = 0;
const logs = [];
const connections = new Set();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  const page = await fs.readFile(
    new URL("./public/index.html", import.meta.url),
    "utf-8",
  );

  res.send(page);
});

app.get("/states", async (req, res) => {
  res.json({ state, logs });
});

app.post("/logs", async (req, res) => {
  if (state === 1) {
    const lastState = state;
    state = 2;

    setTimeout(() => {
      state = lastState;
    }, 5000);

    const log = { date: new Date() };

    logs.push(log);

    for (const connection of connections) {
      connection.write(`data: ${JSON.stringify({ logs })}\n\n`);
    }
  }

  res.send();
});

app.patch("/state", async (req, res) => {
  state = state === 1 ? 0 : 1;
  for (const res of connections) {
    res.write(`data: ${JSON.stringify({ state })}\n\n`);
  }
  res.send();
});

app.get("/sse", async (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  connections.add(res);
  req.on("close", () => connections.delete(res));
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
