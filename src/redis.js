import Redis from "ioredis";
import JSONCache from "redis-json";

const redis = new Redis(process.env.REDISTOGO_URL);
const jsonCache = new JSONCache(redis, { prefix: "cache" });

export default jsonCache;
