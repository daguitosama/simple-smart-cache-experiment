import ms from "ms";
import { Result } from "true-myth";
import { z } from "zod";
import type { RCache } from "./rcache/r-cache.js";
// Define the Post type

const JokeSchema = z.object({
    categories: z.array(z.string()), // Empty array in sample, but allows strings
    created_at: z.string(), // ISO-like datetime string
    icon_url: z.string().url(), // URL for the icon
    id: z.string(), // Unique identifier
    updated_at: z.string(), // ISO-like datetime string
    url: z.string().url(), // URL to the joke
    value: z.string(), // The joke text
});

type Joke = z.infer<typeof JokeSchema>;

// Fetch posts from JSONPlaceholder API
const fetchRandomJoke = async (): Promise<Joke> => {
    const response = await fetch("https://api.chucknorris.io/jokes/random");
    if (!response.ok) throw new Error("Failed to fetch joke");
    return JokeSchema.parse(await response.json());
};
type JokeResult = Promise<Result<Joke, string>>;
export class JokesService {
    // inject RCache instance as private property
    constructor(private rCache: RCache) {}

    async get(): JokeResult {
        const cacheKey = "joke";
        const cacheResult = await this.rCache.get<Joke>(cacheKey, fetchRandomJoke, ms("5s"));
        return cacheResult;
    }
}
