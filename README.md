# Simple Smart Cache Experiment

https://chucknorris.undago.cloud/

A project to experiment how to build a smart cache layer for servers depending on external and slow servers, like a Wordpress REST API slow and far
far away from your Headless Remix app. Why `smart` because the cache system abstract the data querying and revalidation, in a way your server response
never get's delay with that slow outside server, (if is ok to you serve a little bit of stale data). In the background, based on a custom `ttl` policy
data would be revalidated, putting it in the `cacheEntry` value, if your api call or `fetcher` fails, the error would be put on the `cacheEntry`
error, and you could use it as the `fetcher` itself was directly throwing.

Implemented with `redis`, a little and simple Hono app that renders random Chuck Norris jokes, after initial load or warm, there is no way you are
getting those random jokes slow.

Have docker. Setup redis container

```bash
docker run -d --name redis-server -p 6379:6379 redis
```

Optionally attach to it to see the data with the redis cli

```bash
docker exec -it < your container id, run `docker ps` to see > /bin/bash
# then
redis-cli
```

## Hono

```
pnpm install
pnpm dev
```

open http://localhost:3000

Now you get Chuck Norris jokes with out any latency after you prime the cache. Queries revalidate on the background, never affecting the response time
of the app. If there is an error, it would be put on cache and would be usable outside too.

Look `index.tsx` for server app, `services/rcache` for the cache manager, and `services/joke.ts` for the joke resource.

That the low latency force be with YOU!
