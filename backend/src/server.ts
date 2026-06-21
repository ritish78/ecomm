import express from "express";

const app = express();

app.get("/api/v1/ping", (req, res) => {
  return res.status(200).json({ message: "Pong!" });
});

export default app;
