import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { prisma } from "~/lib/prisma";
import { commitSession, destroySession, getSession } from "~/lib/session";

export const meta: MetaFunction = () => {
  return [
    { title: "LINE Messaging API Demo | HOME" },
    { name: "description", content: "LINE Messaging API Demo" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    return redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.get("userId") as number,
    },
  });

  return json({ name: user?.name, lineConnected: user?.lineId });
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
      const session = await getSession(request.headers.get("Cookie"));
      return redirect("/login", {
        headers: {
          "Set-Cookie": await destroySession(session),
        },
      });
    }
  }
}

export default function Index() {
  const { name, lineConnected } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <h1 className="text-2xl font-bold">LINE Meesaging API Demo</h1>
      <p>Welcome, {name}</p>

      <p>
        You can use the following API to send messages to your LINE friends.
      </p>

      <p>
        <span className="mr-1">Connected status:</span>
        {lineConnected ? (
          <span className="text-green-500">Connected</span>
        ) : (
          <span className="text-red-500">Disconnected</span>
        )}
      </p>

      <Form method="delete">
        <Button type="submit">Logout</Button>
      </Form>
    </div>
  );
}
