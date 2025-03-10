import { Result } from "true-myth";
// Fetch posts from JSONPlaceholder API
const fetchPosts = async () => {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    if (!response.ok) {
        throw new Error("Failed to fetch posts");
    }
    return response.json();
};
export class PostService {
    rCache;
    // inject RCache instance as private property
    constructor(rCache) {
        this.rCache = rCache;
    }
    // Fetch posts with caching
    async getPosts() {
        const cacheKey = "posts";
        // console.log(ms("10s"));
        // return Result.ok([]);
        const cacheResult = await this.rCache.get(cacheKey, fetchPosts, 1000);
        return cacheResult;
    }
}
