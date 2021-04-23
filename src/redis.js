import Redis from "ioredis";
import JSONCache from "redis-json";

function redis(){
	if(process.env.REDISTOGO_URL)
		return new Redis(process.env.REDISTOGO_URL)
	return new Redis();
}

const redisInst = redis()

const jsonCache = new JSONCache(redisInst, { prefix: "cache" });

export default jsonCache;
