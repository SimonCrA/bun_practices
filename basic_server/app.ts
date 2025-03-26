import { serve } from "bun";
import { Database } from "bun:sqlite";

interface User {
  id?: number;
  name: string;
  email: string;
}

const server = serve({
  port: 3000,

  routes: {
    "/api/status": new Response("Ok"),

    "/api/versiondb": async () => {
      const db = new Database("simon.sqlite");

      db.run(`
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT
        )
        `);

      const insert = db.prepare(
        "INSERT INTO users (name, email) VALUES (?, ?)",
      );
      insert.run("simon", "simon@gmail.com");

      const select = db.prepare("SELECT * FROM users");
      const users = select.all();

      return Response.json(users);
    },
    "/users/:id": (req) => {
      console.log(req);
      return new Response(`Hello user ${req.params.id}`);
    },
    "/api/posts": {
      GET: () => new Response("List posts"),
      POST: async (req) => {
        const body = await req.json();
        return Response.json({ created: true, ...body });
      },
    },
    "/api/*": Response.json({ message: "Not found" }, { status: 404 }),
    "/blog/hello": Response.redirect("/blog/hello/world"),
  },
  fetch(req) {
    console.log(req);
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Listening on http://localohost:${server.port} ...`);
