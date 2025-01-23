import crypto from "node:crypto";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { userPrefs } from "~/cookies.server";
import { prisma } from "~/lib/prisma";

export async function loader({ request }: LoaderFunctionArgs) {
	const linkToken = new URL(request.url).searchParams.get("linkToken");
	if (!linkToken) {
		return redirect("/", { status: 400 });
	}

	const cookie = (await userPrefs.parse(request.headers.get("Cookie"))) || {};
	if (!cookie.userId) {
		return redirect("/login", {
			headers: {
				"x-redirect-url": "/connect?linkToken=#{link_token}",
			},
		});
	}

	try {
		const nonce = getNonce();
		await prisma.user_line_nonce.upsert({
			where: {
				userId: cookie.userId,
			},
			update: {
				// 1000 * 60 * 60 = 1 hour
				expiresAt: new Date(Date.now() + 1000 * 60 * 60),
				nonce,
			},
			create: {
				userId: cookie.userId,
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
