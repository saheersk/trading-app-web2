
import { PrismaClient } from "@prisma/client";
import { Router } from "express";


const prisma = new PrismaClient();
export const tickersRouter = Router();

tickersRouter.get("/:market", async (req, res) => {
    const { market } = req.params;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    try {
        // 1. Fetch the latest trade for the current price
        //@ts-ignore
        const latestTrade = await prisma.trade.findFirst({
            where: { market },
            orderBy: { timestamp: 'desc' },
        });
        
        const latestPrice = latestTrade?.price ?? 0;

        // 2. Fetch the trade price from 24 hours ago
        //@ts-ignore
        const trade24HrsAgo = await prisma.trade.findFirst({
            where: {
                market,
                timestamp: { lte: startDate },
            },
            orderBy: { timestamp: 'desc' },
        });
        
        const price24HrsAgo = trade24HrsAgo?.price ?? latestPrice;

        // 3. Calculate 24H Change and 24H Change %
        const priceChange = latestPrice - price24HrsAgo;
        const priceChangePercentage = price24HrsAgo ? (priceChange / price24HrsAgo) * 100 : 0;

        // 4. Fetch 24H High and 24H Low directly from trades
        //@ts-ignore
        const highLow = await prisma.trade.aggregate({
            where: {
                market,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _max: { price: true },
            _min: { price: true },
        });

        const high24Hrs = highLow._max.price ?? latestPrice;
        const low24Hrs = highLow._min.price ?? latestPrice;

        // 5. Calculate 24H Volume
        //@ts-ignore
        const volumeAggregate = await prisma.trade.aggregate({
            where: {
                market,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: { volume: true },
        });
        const volume24Hrs = volumeAggregate._sum.volume ?? 0;

        // Format the result
        res.status(200).json({
            currentPrice: latestPrice,
            priceChange,
            priceChangePercentage,
            high24Hrs,
            low24Hrs,
            volume24Hrs,
        });
    } catch (err) {
        console.error("Error fetching stock details:", err);
        res.status(500).send({ error: "Internal server error" });
    }
});
