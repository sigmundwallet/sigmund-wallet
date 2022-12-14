FROM node:18 as installer
WORKDIR /app
RUN apt-get update
RUN apt install make gcc g++ python3 curl cmake
COPY package.json .
COPY yarn.lock .
RUN yarn install

FROM installer as builder
COPY . .
ARG NEXT_PUBLIC_BITCOIN_NETWORK
ARG NEXT_PUBLIC_BITCOIN_EXPLORER_URL
ARG NEXT_PUBLIC_DEPLOYMENT_URL
ENV PRISMA_FIELD_ENCRYPTION_KEY=k1.aesgcm256.zY-L3saxF2-7rZ-5ngsF9PMpxUBqBJsFUDfy0VAOAbI= 
RUN env
RUN yarn prisma generate
RUN yarn build

FROM node:18-slim as tracker
WORKDIR /app
COPY --from=builder /app/.next/standalone .
COPY --from=builder /app/node_modules/tiny-secp256k1/lib/secp256k1.wasm ./node_modules/tiny-secp256k1/lib
COPY --from=builder /app/node_modules/zeromq/build ./node_modules/zeromq/build
COPY --from=builder /app/node_modules/zeromq/prebuilds ./node_modules/zeromq/prebuilds
COPY --from=builder /app/.next/server/bitcoinTracker.js .next/server
EXPOSE 28333
CMD ["node", ".next/server/bitcoinTracker.js"]


FROM node:18-slim as app
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone .
COPY --from=builder /app/node_modules/zeromq/build ./node_modules/zeromq/build
COPY --from=builder /app/node_modules/zeromq/prebuilds ./node_modules/zeromq/prebuilds
COPY --from=builder /app/node_modules/tiny-secp256k1/lib/secp256k1.wasm ./node_modules/tiny-secp256k1/lib
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000

CMD ["node", "server.js"]
