import "dotenv/config";
import http from "http";
import { OAuth2Client } from "google-auth-library";

const PORT = 3005;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.send";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be in server/.env",
  );
  process.exit(1);
}

const client = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: REDIRECT_URI,
});

const authUrl = client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [SCOPE],
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`Google returned: ${url.searchParams.get("error") ?? "no code"}`);
    console.error("No code returned:", url.searchParams.get("error"));
    server.close();
    return;
  }

  try {
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error(
        "Google didn't return a refresh token. Remove Mothball's access at myaccount.google.com/permissions and run this again.",
      );
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Done! Go back to your terminal.");

    console.log("\nAdd this to server/.env and to Render's Environment:\n");
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Something went wrong. Check your terminal.");
    console.error(err instanceof Error ? err.message : err);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(
    "\nOpen this link, sign in with the Mothball Gmail account, and allow sending email:\n",
  );
  console.log(`${authUrl}\n`);
});
