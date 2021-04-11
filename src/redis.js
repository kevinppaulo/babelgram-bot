import Redis from "ioredis";
import JSONCache from "redis-json";

const redis = new Redis();
const jsonCache = new JSONCache(redis, { prefix: "cache" });

export default jsonCache;
