import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
export const klineRouter = Router();

klineRouter.get("/", async (req: any, res: any) => {
    const { market, interval, startTime, endTime } = req.query;

    const intervalMap: Record<string, "ONE_MINUTE" | "ONE_HOUR" | "ONE_WEEK"> = {
        "1m": "ONE_MINUTE",
        "1h": "ONE_HOUR",
        "1w": "ONE_WEEK",
    };

    const selectedInterval = intervalMap[interval as string];
    if(!selectedInterval || !market) {
        return res.status(400).send('Invalid interval or missing market');
    } 

    const startDate = new Date(parseInt(startTime as string, 10) * 1000);
    const endDate = new Date(parseInt(endTime as string, 10) * 1000);

    try {
        const result = await prisma.Klines.findMany({
            where: {
                market: market as string,
                interval: selectedInterval,
                bucket: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                bucket: 'asc',
            },
        });

        const formattedResult = result.map((x: any) => ({
            close: x.close,
            end: x.bucket,
            high: x.high,
            low: x.low,
            open: x.open,
            quoteVolume: x.quoteVolume,
            start: x.start,
            trades: x.trades,
            volume: x.volume,
        }));

        res.status(200).json(formattedResult);
    } catch (err) {
        console.error("Error fetching klines data:", err);
        res.status(500).send({ error: "Internal server error" });
    }
});