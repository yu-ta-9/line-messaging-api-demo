import {
	LINE_SIGNATURE_HTTP_HEADER_NAME,
	type WebhookEvent,
	validateSignature,
} from "@line/bot-sdk";
import { type ActionFunctionArgs, json } from "@remix-run/node";
import { getMessagingApiClient } from "~/lib/lineBot";
import { prisma } from "~/lib/prisma";

export const action = async ({ request }: ActionFunctionArgs) => {
	if (request.method !== "POST") {
		return json({ message: "Method not allowed" }, 405);
	}

	const signature = request.headers.get(LINE_SIGNATURE_HTTP_HEADER_NAME) || "";
	const body = await request.clone().text();
	if (
		!validateSignature(body, process.env.LINE_CHANNEL_SECRET || "", signature)
	) {
		return json({ message: "Invalid signature" }, 403);
	}

	const payload = await request.json();
	const events = payload.events as WebhookEvent[];
	for (const event of events) {
		switch (event.type) {
			case "follow": {
				try {
					const client = getMessagingApiClient();
					if (event.source.type !== "user") {
						break;
					}

					const linkTokenResponse = await client.issueLinkToken(
						event.source.userId,
					);
					await client.replyMessage({
						replyToken: event.replyToken,
						messages: [
							{
								type: "text",
								text: "友達追加ありがとうございます！\nアカウントを連携してください！",
							},
							{
								type: "template",
								altText: "アカウントを連携する",
								template: {
									type: "buttons",
									text: "アカウントを連携する",
									actions: [
										{
											type: "uri",
											label: "アカウントを連携する",
											uri: `${process.env.FRONTEND_URL}/connect?linkToken=${linkTokenResponse.linkToken}`,
										},
									],
								},
							},
						],
					});
				} catch (e) {
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					console.error((e as any).status);
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					console.error((e as any).body);
				}
				break;
			}
			case "accountLink": {
				try {
					if (event.link.result !== "ok") {
						throw new Error("Invalid nonce");
					}

					const userLineNonce = await prisma.user_line_nonce.findFirst({
						where: {
							nonce: event.link.nonce,
							expiresAt: {
								gt: new Date(), // 有効期限が過ぎていないか
							},
						},
					});
					if (!userLineNonce) {
						throw new Error("Invalid nonce");
					}

					await prisma.user.update({
						where: {
							id: userLineNonce.userId,
						},
						data: {
							lineId: event.source.userId,
						},
					});

					const client = getMessagingApiClient();
					await client.replyMessage({
						replyToken: event.replyToken,
						messages: [
							{ type: "text", text: "アカウント連携が完了しました！" },
						],
					});
				} catch (e) {
					const client = getMessagingApiClient();
					await client.replyMessage({
						replyToken: event.replyToken,
						messages: [
							{
								type: "text",
								text: "アカウント連携に失敗しました。再度お試しください。",
							},
						],
					});
				}
				break;
			}
		}
	}

	return json({ success: true }, 200);
};
