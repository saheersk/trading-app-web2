import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
import { ORDER_UPDATE, TRADE_ADDED } from "./types";

const prisma = new PrismaClient();

async function main() {
  const redisClient = createClient();
  redisClient.on('error', (err) => {
    console.error('Redis Connection Error:', err);
  });
  
  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });
  
  // Debug log
  console.log('Attempting to connect to Redis with config:', redisClient.options);
  
  try {
    await redisClient.connect();
    console.log("connected to redis");

    while (true) {
      const response = await redisClient.rPop("db_processor");
      if (response) {
        const data: any = JSON.parse(response);
        if (data.type === TRADE_ADDED) {
          const market = data.data.market;

          const symbol = market.split("_")[0];

          const stock = await prisma.stock.findUnique({
            where: {
              symbol: symbol,
            },
            select: {
              id: true,
            },
          });

          const price = data.data.price;
          const volume = data.data.quantity;
          const stockId = stock?.id;
          const side = data.data.side;
          const timestamp = new Date(data.data.timestamp);

          const trade = await prisma.trade.create({
            //@ts-ignore
            data: {
              timestamp: timestamp,
              price: parseFloat(price),
              volume: parseFloat(volume),
              stockId: stockId,
              side: side.toUpperCase(),
            },
          });
        }
        else if (data.type === ORDER_UPDATE) {
          console.log("ORDER_PLACED");
          console.log(data);
          const market = data.data.market;

          const symbol = market.split("_")[0];

          const stock = await prisma.stock.findUnique({
            where: {
              symbol: symbol,
            },
            select: {
              id: true,
            },
          });

          const stockId = stock?.id;


          // const trade = await prisma.orderHistory.create({
          //   //@ts-ignore
          //   data: {
          //     price: parseFloat(data.data.price),
          //     volume: parseFloat(data.data.volume),
          //     userId: data.data.userId,
          //     stockId: stockId,
          //     side: data.data.side.toUpperCase(),
          //     executedQty:,
          //     remainingQty:,
          //     status: "COMPLETED"
          //   },
          // });
        }
      }
    }
  } catch (e) {
    console.error("Error connecting to Redis:", e);
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
