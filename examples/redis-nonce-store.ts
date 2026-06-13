import Redis from "ioredis";
import { RedisNonceStore } from "guard-stack";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
const nonceStore = new RedisNonceStore(redis);

export { nonceStore };
