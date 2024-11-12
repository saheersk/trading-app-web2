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
            const data: any = JSON.parse(response);
            if (data.type === "TRADE_ADDED") {
                console.log("adding data");
                console.log(data);
                const price = data.data.price;
                const volume = data.data.volume;
                const stockId = data.data.stockId;
                const side = data.data.side;
                const timestamp = new Date(data.data.timestamp);

            //     // Insert data into the tata_prices table
                await prisma.trade.create({
                    data: {
                        timestamp: timestamp,
                        price: price,
                        volume: volume,
                        stockId: stockId,
                        side: side
                        // You can add volume here if needed by adding it to the schema and DbMessage type
                    }
                });
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
