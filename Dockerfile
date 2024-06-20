FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g typescript
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate
RUN tsc
EXPOSE 3000
CMD ["node", "dist/server.js"]