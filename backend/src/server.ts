import express, { Request, Response } from "express";

const app = express();

app.get("/api/v1/ping", (req: Request, res: Response) => {
  return res.status(200).json({ message: "Pong!" });
});

export default app;
