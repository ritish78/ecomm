import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/error";

/**
 * @param error         unknown - any error that gets thrown. we have also implemented custom error class
 * @param req           Request object from express
 * @param res           Response object from express
 * @param next          Nextfunction function
 * @returns             Response depending upon the error types
 */
export const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).send({ error: error.name, message: error.message });
  }

  //if the error is from Zod
  if (error instanceof ZodError) {
    const fields = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      expected: issue.code === "invalid_type" ? issue.expected : undefined,
      received:
        issue.code === "invalid_type"
          ? issue.input === undefined
            ? "undefined"
            : typeof issue.input
          : undefined,
    }));

    return res.status(400).send({
      error: error.name,
      message: "Could not process the invalid body!",
      fields,
    });
  }

  //For other errors
  return res.status(500).send({
    error: "Server Error!",
    message:
      "Oops! Looks like our server is not able to process requests at the moment! Please visit back later!",
  });
};
