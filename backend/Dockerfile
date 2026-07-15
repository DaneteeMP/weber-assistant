FROM rust:1.87-slim as builder
WORKDIR /app
COPY backend/ backend/
RUN cd backend && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/backend/target/release/backend /usr/local/bin/backend
EXPOSE 3000
CMD ["backend"]
