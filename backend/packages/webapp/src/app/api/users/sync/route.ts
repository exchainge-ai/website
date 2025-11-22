import { NextResponse } from "next/server";
import { upsertUser } from "@/lib/db/users";
import { handleHttpError } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { logger } from "@/lib/server/logger";
import { privyServer } from "@/lib/privy-server";
import { UnauthorizedError } from "@/lib/server/errors";

export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedError();
    }

    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      throw new UnauthorizedError();
    }

    const claims = await privyServer.verifyAuthToken(token);
    const privyId = (claims as any).userId || (claims as any).sub;

    if (!privyId) {
      throw new UnauthorizedError("Invalid auth token");
    }

    enforceRateLimit(privyId, { max: 20, windowMs: 60_000 });

    const payload = await request.json();

    const displayName =
      typeof payload?.displayName === "string" ? payload.displayName : null;
    const email =
      typeof payload?.email === "string" ? payload.email : null;
    const walletAddress =
      typeof payload?.walletAddress === "string" ? payload.walletAddress : null;

    const user = await upsertUser({
      privy_id: privyId,
      display_name: displayName ?? email ?? walletAddress ?? "User",
      email,
      wallet_address: walletAddress,
      account_type: payload?.accountType ?? "individual",
    });

    if (user) {
      const isNewUser = Date.now() - new Date(user.created_at).getTime() < 5000;

      if (isNewUser) {
        logger.auth.signup(user.id, privyId, user.account_type ?? "individual");
      } else {
        logger.auth.login(user.id, privyId, walletAddress ? "wallet" : "email");
      }
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    return handleHttpError(error);
  }
}
