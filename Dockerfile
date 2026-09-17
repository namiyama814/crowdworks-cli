FROM node:24-bookworm

WORKDIR /workspace
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "check"]
