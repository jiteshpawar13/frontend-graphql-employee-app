# Stage 1: Build
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
COPY .env.production .env
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]