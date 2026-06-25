import express, { Request, Response } from "express";
import cookies from "cookie-parser";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./routes/auth.route";
import { errorHandler } from "./middleware/errorHandler";
import { FRONTEND_URL } from "./config";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: true,
    // origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(cookies());

app.get("/api/v1/ping", (req: Request, res: Response) => {
  return res.status(200).json({ message: "Pong!" });
});

app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

export default app;
