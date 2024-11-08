import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import { DbMessage } from './types';

const prisma = new PrismaClient();

async function main() {
    const redisClient = createClient();
    await redisClient.connect();
    console.log("connected to redis");

    while (true) {
        const response = await redisClient.rPop("db_processor");
        if (!response) {
            // handle empty response if needed
        } else {
            const data: DbMessage = JSON.parse(response);
            if (data.type === "TRADE_ADDED") {
                console.log("adding data");
                console.log(data);
            //     const price = data.data.price;
            //     const timestamp = new Date(data.data.timestamp);

            //     // Insert data into the tata_prices table
            //     await prisma.tataPrice.create({
            //         data: {
            //             time: timestamp,
            //             price: price,
            //             // You can add volume here if needed by adding it to the schema and DbMessage type
            //         }
            //     });
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
