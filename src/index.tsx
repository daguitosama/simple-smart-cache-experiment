import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { Redis } from "ioredis";
import { JokesService } from "./services/joke.js";
import { RCache } from "./services/rcache/r-cache.js";

// Create Hono app
const app = new Hono();

// Initialize Redis connection
const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost", // or your Redis container host
    port: 6379, // default Redis port
});
const rCache = new RCache(redis);

const jokeService = new JokesService(rCache);
// JSX renderer middleware
app.use(
    "*",
    jsxRenderer(({ children }) => {
        return (
            <html>
                <body>{children}</body>
            </html>
        );
    })
);
// Main route
app.get("/", async (c) => {
    const _start = Date.now();
    const jokeResult = await jokeService.get();

    if (jokeResult.isErr) {
        return c.render(
            <div>
                <h1>Ops something bad happened</h1>
                <p>{jokeResult.error}</p>
            </div>
        );
    }
    const joke = jokeResult.value;

    return c.render(
        <div>
            <h1>Joke served in: {Date.now() - _start} ms</h1>
            <p style={{ fontSize: ".8rem" }}>id: {joke.id}</p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <img src={joke.icon_url} />
                <em>{joke.value}</em>
            </div>
        </div>
    );
});

// Error handling
app.onError((err, c) => {
    console.error(err);
    return c.text("Internal Server Error", 500);
});

// Start server
const port = 3000;
console.log(`Server running at http://localhost:${port}`);
serve({
    fetch: app.fetch,
    port,
});
