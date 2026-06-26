import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const environmentVariableSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  EXPRESS_SERVER_PORT: z.string().trim().min(1),
  FRONTEND_URL: z.string().trim().min(1),
  POSTGRES_DATA_URL: z.string().trim().min(1),
  JWT_ACCESS_SECRET: z.string().trim().min(1),
  JWT_REFRESH_SECRET: z.string().trim().min(1),
  GOOGLE_CLIENT_ID: z.string().trim().min(1),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
});

try {
  environmentVariableSchema.parse(process.env);
} catch (error) {
  throw new Error("Please provide all environment variables!");
}

type EnvSchemaType = z.infer<typeof environmentVariableSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvSchemaType {}
  }
}
