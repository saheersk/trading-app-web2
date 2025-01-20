import { createClient } from "redis";
import { Engine } from "./trade/Engine";


async function main() {
    const engine = new Engine(); 
    const redisClient = createClient({
        url: "redis://localhost:6379"
    });
    await redisClient.connect();
    console.log("Connected to Redis");

    while (true) {
        const response = await redisClient.rPop("messages" as string);
        if(response) {
            console.log(response, "Engine message=====");
            engine.process(JSON.parse(response));
        }
    }
}

main();