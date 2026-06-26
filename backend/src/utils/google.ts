import { OAuth2Client } from "google-auth-library";
import { FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config";
import { AuthError } from "./error";

const client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${FRONTEND_URL}/google/callback`, //i have /google/callback in google's console as redirect
);

export async function exchangeGoogleCode(code: string) {
  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new AuthError("Did not receive any token back from Google!");
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new AuthError("Invalid Google Token provided!");
  }

  return {
    googleId: payload.sub,
    email: payload.email!, //without ! at the end, TS was not allowing findUserByEmail as it needed email as string and TS thought here, the email could be undefined
    firstName: payload.given_name ?? "",
    lastName: payload.family_name ?? "",
    avatarUrl: payload.picture,
    //for email verified, we will set it as true as the user is logged in using google
  };
}
