import { makeBadge } from "badge-maker";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type Session = {
  did: string;
  handle: string;
  email: string;
  accessJwt: string;
  refreshJwt: string;
};

const createSession = async (
  app_user: string,
  app_token: string
): Promise<Session> => {
  const url = "https://bsky.social/xrpc/com.atproto.server.createSession";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: app_user,
      password: app_token,
    }),
  });
  const data = await response.json();
  return data;
};

const getFeed = async (session: Session, feed: string): Promise<any> => {
  const url = `https://bsky.social/xrpc/app.bsky.feed.getFeedGenerator?feed=${feed}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
  });
  const data = await response.json();
  return data;
};

const badgeTypes = {
  likes: (feed) => ({
    label: "Feed Likes",
    message: `${feed.view.likeCount}`,
    color: "rgb(0, 133, 255)",
    style: "flat",
  }),
  name: (feed) => ({
    label: "Feed Name",
    message: `${feed.view.displayName}`,
    color: "rgb(0, 133, 255)",
    style: "flat",
  }),
  creator: (feed) => ({
    label: "Feed Creator",
    message: `${feed.view.creator.handle}`,
    color: "rgb(0, 133, 255)",
    style: "flat",
  }),
};

export default async (req: VercelRequest, response: VercelResponse) => {
  const { feed: feedUri, badgeType = "likes" } = req.query;
  if (
    !process.env.BSKY_HANDLE ||
    !process.env.BSKY_APP_PASSWORD ||
    !feedUri ||
    Array.isArray(feedUri) ||
    Array.isArray(badgeType)
  ) {
    return response.status(500).send("Invalid Request");
  }
  const authData = await createSession(
    process.env.BSKY_HANDLE,
    process.env.BSKY_APP_PASSWORD
  );
  const feed = await getFeed(authData, feedUri);
  const badgeFormat = badgeTypes[badgeType](feed);
  const svg = makeBadge(badgeFormat);
  return response
    .setHeader("content-type", "image/svg+xml")
    .status(200)
    .send(svg);
};
