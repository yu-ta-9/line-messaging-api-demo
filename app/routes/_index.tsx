import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
	redirect,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { userPrefs } from "~/cookies.server";

export const meta: MetaFunction = () => {
	return [
		{ title: "LINE Messaging API Demo | HOME" },
		{ name: "description", content: "LINE Messaging API Demo" },
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const cookieHeader = request.headers.get("Cookie");
	const cookie = (await userPrefs.parse(cookieHeader)) || {};

	if (!cookie.userId) {
		return redirect("/login");
	}

	return json({ cookie });
}

export async function action({ request }: ActionFunctionArgs) {
	switch (request.method) {
		case "POST": {
			break;
		}
		case "PUT": {
			break;
		}
		case "PATCH": {
			break;
		}
		case "DELETE": {
			return redirect("/login", {
				headers: {
					"Set-Cookie": await userPrefs.serialize({
						userId: "",
						expires: new Date(1970, 0, 1),
					}),
				},
			});
		}
	}
}

export default function Index() {
	return (
		<div className="flex h-screen items-center justify-center flex-col gap-4">
			<h1 className="text-2xl font-bold">LINE Meesaging API Demo</h1>

			<Button>Click me</Button>
			{/* logout */}
			<Form method="delete">
				<Button type="submit">Logout</Button>
			</Form>
		</div>
	);
}
