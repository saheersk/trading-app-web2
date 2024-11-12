import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
export const tradesRouter = Router();

async function getLast20TradesByStockId(symbol: string) {
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

// Example usage in a route handler
//@ts-ignore
tradesRouter.get("/", async (req, res) => {
    const { market }: any = req.query;

    const symbol = market.split("_")[0];

    if (!symbol) {
        return res.status(400).send('Missing symbol parameter');
    }

    try {
        const trades = await getLast20TradesByStockId(symbol.toString());
        res.status(200).json(trades);
    } catch (err) {
        console.error("Error fetching last 20 trades:", err);
        res.status(500).send({ error: "Internal server error" });
    }
});

