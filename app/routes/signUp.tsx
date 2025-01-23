import {
	type ActionFunction,
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
} from "@remix-run/node";
import { Form, redirect, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { userPrefs } from "~/cookies.server";

import { prisma } from "~/lib/prisma";

export const meta: MetaFunction = () => {
	return [
		{ title: "LINE Messaging API Demo | SignUp" },
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
	const name = formData.get("name");

	if (typeof email !== "string" || email.length === 0) {
		return json({ errors: { title: "Email is required" } }, { status: 422 });
	}

	if (typeof password !== "string" || password.length === 0) {
		return json({ errors: { title: "Password is required" } }, { status: 422 });
	}

	if (typeof name !== "string" || name.length === 0) {
		return json({ errors: { title: "Name is required" } }, { status: 422 });
	}

	const user = await prisma.user.create({
		data: {
			email,
			password,
			name,
		},
	});

	cookie.userId = user.id;

	return redirect("/", {
		headers: {
			"Set-Cookie": await userPrefs.serialize(cookie),
		},
	});
};

export default function SignUp() {
	const actionData = useActionData<{ errors: { title: string } }>();

	return (
		<div className="flex h-screen items-center justify-center flex-col gap-4">
			<h1 className="text-2xl font-bold">SignUp</h1>

			<Form className="flex flex-col gap-4" replace method="post">
				{actionData?.errors && (
					<div className="text-red-500">{actionData.errors.title}</div>
				)}

				<Input type="email" name="email" placeholder="email" />
				<Input type="password" name="password" placeholder="password" />
				<Input type="text" name="name" placeholder="name" />

				<Button type="submit">SignUp</Button>
			</Form>
		</div>
	);
}
