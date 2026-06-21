import express, { Request, Response } from "express";
import cookies from "cookie-parser";

import authRoutes from "./routes/auth.route";

const app = express();

app.use(express.json());
app.use(cookies());

app.get("/api/v1/ping", (req: Request, res: Response) => {
  return res.status(200).json({ message: "Pong!" });
});

app.use("/api/v1/auth", authRoutes);

export default app;
