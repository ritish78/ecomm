import express, { Request, Response } from "express";
import cookies from "cookie-parser";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./routes/auth.route";
import productRoutes from "./routes/product.route";
import storeRoutes from "./routes/store.route";
import brandRoutes from "./routes/brand.route";
import categoriesRoutes from "./routes/categories.route";

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
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/stores", storeRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/categories", categoriesRoutes);

app.use(errorHandler);

export default app;
