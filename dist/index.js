import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { Redis } from "ioredis";
import { JokesService } from "./services/joke.js";
import { PostService } from "./services/posts.js";
import { RCache } from "./services/rcache/r-cache.js";
// Create Hono app
const app = new Hono();
// Initialize Redis connection
const redis = new Redis({
    host: "localhost", // or your Redis container host
    port: 6379, // default Redis port
});
const rCache = new RCache(redis);
const postService = new PostService(rCache);
const jokeService = new JokesService(rCache);
// JSX renderer middleware
app.use("*", jsxRenderer(({ children }) => {
    return (_jsx("html", { children: _jsx("body", { children: children }) }));
}));
// Main route
app.get("/", async (c) => {
    const _start = Date.now();
    const jokeResult = await jokeService.get();
    if (jokeResult.isErr) {
        return c.render(_jsxs("div", { children: [_jsx("h1", { children: "Ops something bad happened" }), _jsx("p", { children: jokeResult.error })] }));
    }
    const joke = jokeResult.value;
    return c.render(_jsxs("div", { children: [_jsxs("h1", { children: ["Joke served in: ", Date.now() - _start, " ms"] }), _jsxs("p", { style: { fontSize: ".8rem" }, children: ["id: ", joke.id] }), _jsxs("div", { style: { display: "flex", gap: "1rem", marginTop: "2rem" }, children: [_jsx("img", { src: joke.icon_url }), _jsx("em", { children: joke.value })] })] }));
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
