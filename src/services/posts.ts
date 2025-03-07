import { Result } from "true-myth";
import type { RCache } from "./rcache/r-cache.js";
// Define the Post type
type Post = {
    id: number;
    title: string;
    body: string;
};

// Fetch posts from JSONPlaceholder API
const fetchPosts = async (): Promise<Post[]> => {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    if (!response.ok) {
        throw new Error("Failed to fetch posts");
    }
    return response.json();
};
type PostsResult = Promise<Result<Post[], string>>;
export class PostService {
    // inject RCache instance as private property
    constructor(private rCache: RCache) {}

    // Fetch posts with caching
    async getPosts(): PostsResult {
        const cacheKey = "posts";
        // console.log(ms("10s"));
        // return Result.ok([]);
        const cacheResult = await this.rCache.get<Post[]>(cacheKey, fetchPosts, 1000);
        return cacheResult;
    }
}
