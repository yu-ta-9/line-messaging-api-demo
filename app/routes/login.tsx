import type {
  ActionFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Form, Link, json, redirect, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { prisma } from "~/lib/prisma";
import { commitSession, getSession } from "~/lib/session";

export const meta: MetaFunction = () => {
  return [
    { title: "LINE Messaging API Demo | Login" },
    { name: "description", content: "LINE Messaging API Demo" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    return redirect("/");
  }

  return json({ result: "ok" }, { status: 200 });
}

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

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

  session.set("userId", user.id);
  const redirectUrl = request.headers.get("x-redirect-url");

  return redirect(redirectUrl || "/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function Login() {
  const actionData = useActionData<{ errors: { title: string } }>();

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <h1 className="text-2xl font-bold">Login</h1>

      <Form className="flex flex-col gap-4" replace method="post">
        {actionData?.errors && (
          <div className="text-red-500">{actionData.errors.title}</div>
        )}

        <Input type="email" name="email" placeholder="email" />
        <Input type="password" name="password" placeholder="password" />

        <Button type="submit">Login</Button>
      </Form>

      <Link to="/signup">Sign up</Link>
    </div>
  );
}
