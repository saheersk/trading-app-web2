import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getLast20TradesByStockId(symbol: string) {
    //@ts-ignore
    const trades = await prisma.trade.findMany({
        where: {
            stock: {
                symbol: symbol, // Nested filter within the related `stock` model
            },
        },
        orderBy: {
            timestamp: 'desc', // Get the most recent trades
        },
        take: 20, // Limit to the last 20 trades
        select: {
            price: true,
            volume: true,
            timestamp: true,
            stock: {
                select: {
                    symbol: true, // Optionally include the stock symbol if needed
                },
            },
            side: true
        },
    });

    //@ts-ignore
    return trades.map(trade => ({
        symbol: trade.stock.symbol,
        price: trade.price,
        volume: trade.volume,
        timestamp: trade.timestamp,
        side: trade.side
    }));
}