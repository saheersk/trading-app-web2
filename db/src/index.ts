import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
import { DbMessage } from "./types";

const prisma = new PrismaClient();

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("connected to redis");

  while (true) {
    const response = await redisClient.rPop("db_processor");
    if (response) {
      const data: any = JSON.parse(response);
      if (data.type === "TRADE_ADDED") {
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
