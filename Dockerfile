### BASE ####
FROM node:22.11-alpine AS base
WORKDIR /app


ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# RUN corepack disable
RUN npm install -g pnpm

# copy relevant files from the docker context
# review .dockerignore for a list of ignored files & folders
COPY . .


### PROD DEPS
FROM base AS prod-deps
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile


#### BUILD  #####
FROM base AS build
WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build


### RUNNER ######
FROM base AS runnner
WORKDIR /app

ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED 1


# create non-root user
RUN addgroup --system -g 1001 -S chuck-app-server
RUN adduser --system -g 1001 -S chuck-app-server
RUN chown -R chuck-app-server:chuck-app-server /app

# copy files from the builder
COPY --from=prod-deps   --chown=chuck-app-server:chuck-app-server     /app/node_modules       /app/node_modules
COPY --from=build       --chown=chuck-app-server:chuck-app-server     /app/dist              /app/dist

# remove unnecessary files
# RUN wget https://gobinaries.com/tj/node-prune --output-document - | /bin/sh
# RUN node-prune


USER chuck-app-server

CMD [ "node", "./dist/index.js" ]
