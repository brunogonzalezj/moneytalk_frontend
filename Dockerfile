# PWA de MoneyTalk: las variables VITE_* se fijan al construir, así que llegan como build args.
FROM node:22-alpine AS build
WORKDIR /app
# The project uses pnpm (pnpm-lock.yaml)
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_VAPID_PUBLIC_KEY=""
ENV VITE_API_URL=$VITE_API_URL VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY
RUN pnpm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
