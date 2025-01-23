import type { MetaFunction } from "@remix-run/node";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
	return [
		{ title: "LINE Messaging API Demo | Link" },
		{ name: "description", content: "LINE Messaging API Demo" },
	];
};

export default function Link() {
	return (
		<div className="flex h-screen items-center justify-center flex-col gap-4">
			<h1 className="text-2xl font-bold">Link</h1>

			<Button>Click me</Button>
		</div>
	);
}
