import { messagingApi } from "@line/bot-sdk";

export const getMessagingApiClient = () => {
	return new messagingApi.MessagingApiClient({
		channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
	});
};
