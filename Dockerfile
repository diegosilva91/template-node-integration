FROM node:18-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
EXPOSE 8081
WORKDIR /app
COPY web .
RUN npm install
RUN cd frontend && npm install && SHOPIFY_API_KEY=ff3b941e8550ebdf118f88c3cb1c269c npm run build
CMD ["npm", "run", "serve"]
