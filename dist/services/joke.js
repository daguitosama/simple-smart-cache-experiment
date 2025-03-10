import { Result } from "true-myth";
import { z } from "zod";
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
// Fetch posts from JSONPlaceholder API
const fetchRandomJoke = async () => {
    const response = await fetch("https://api.chucknorris.io/jokes/random");
    if (!response.ok)
        throw new Error("Failed to fetch joke");
    return JokeSchema.parse(await response.json());
};
export class JokesService {
    rCache;
    // inject RCache instance as private property
    constructor(rCache) {
        this.rCache = rCache;
    }
    async get() {
        const cacheKey = "joke";
        // console.log(ms("10s"));
        // return Result.ok([]);
        const cacheResult = await this.rCache.get(cacheKey, fetchRandomJoke, 1000);
        return cacheResult;
    }
}
