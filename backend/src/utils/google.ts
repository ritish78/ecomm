import { OAuth2Client } from "google-auth-library";
import { GOOGLE_CLIENT_ID } from "../config";
import { AuthError } from "./error";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
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
