import crypto from "node:crypto";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { prisma } from "~/lib/prisma";
import { getSession } from "~/lib/session";

export async function loader({ request }: LoaderFunctionArgs) {
  const linkToken = new URL(request.url).searchParams.get("linkToken");
  if (!linkToken) {
    return redirect("/", { status: 400 });
  }

  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    return redirect("/login", {
      headers: {
        "x-redirect-url": `/connect?linkToken=${linkToken}`,
      },
    });
  }

  try {
    const nonce = getNonce();
    await prisma.user_line_nonce.upsert({
      where: {
        userId: session.get("userId") as number,
      },
      update: {
        // 1000 * 60 * 60 = 1 hour
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        nonce,
      },
      create: {
        userId: session.get("userId") as number,
        nonce,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const linkUrl = `https://access.line.me/dialog/bot/accountLink?linkToken=${linkToken}&nonce=${nonce}`;
    return redirect(linkUrl);
  } catch (e) {
    console.error(e);
    return redirect("/", { status: 500 });
  }
}

/**
 * セキュアなランダム生成関数を使う。
 * 少なくとも128ビット（16バイト）以上にする。
 * Base64エンコードする。
 */
const getNonce = () => {
  return crypto.randomBytes(16).toString("base64");
};
