import type {
	ActionFunction,
	LoaderFunctionArgs,
	MetaFunction,
} from "@remix-run/node";
import { Form, Link, json, redirect } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { userPrefs } from "~/cookies.server";
import { prisma } from "~/lib/prisma";

export const meta: MetaFunction = () => {
	return [
		{ title: "LINE Messaging API Demo | Login" },
		{ name: "description", content: "LINE Messaging API Demo" },
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const cookieHeader = request.headers.get("Cookie");
	const cookie = (await userPrefs.parse(cookieHeader)) || {};

	if (cookie.userId) {
		return redirect("/");
	}

	return json({ result: "ok" }, { status: 200 });
}

export const action: ActionFunction = async ({ request }) => {
	const cookieHeader = request.headers.get("Cookie");
	const cookie = (await userPrefs.parse(cookieHeader)) || {};

	const formData = await request.formData();
	const email = formData.get("email");
	const password = formData.get("password");

	if (typeof email !== "string" || email.length === 0) {
		return json({ errors: { title: "Email is required" } }, { status: 422 });
	}

	if (typeof password !== "string" || password.length === 0) {
		return json({ errors: { title: "Password is required" } }, { status: 422 });
	}

	const user = await prisma.user.findUnique({
		where: {
			email,
			password,
		},
	});

	if (!user) {
		return json({ errors: { title: "User not found" } }, { status: 401 });
	}

	cookie.userId = user.id;

	const redirectUrl = request.headers.get("x-redirect-url");
	return redirect(redirectUrl || "/", {
		headers: {
			"Set-Cookie": await userPrefs.serialize(cookie),
		},
	});
};

export default function Login() {
	return (
		<div className="flex h-screen items-center justify-center flex-col gap-4">
			<h1 className="text-2xl font-bold">Login</h1>

			<Form className="flex flex-col gap-4" replace method="post">
				<Input type="email" placeholder="email" />
				<Input type="password" placeholder="password" />

				<Button type="submit">Login</Button>
			</Form>

			<Link to="/signup">Sign up</Link>
		</div>
	);
}
