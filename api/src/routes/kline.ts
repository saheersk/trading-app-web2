import { Router } from "express";
import { generateKlines } from "../controller/klineController";

export const klineRouter = Router();


//@ts-ignore
klineRouter.get("/", async (req, res) => {
    const { market, interval, startTime, endTime }: any = req.query;

    const symbol = market.split("_")[0];

    const bucketMap: any = {
        "1m": 60 * 1000,
        "5m": 5 * 60 * 1000,
        "15m": 15 * 60 * 1000,
        "30m": 30 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "4h": 4 * 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
    };

    try {
        // Input validation
        if (!symbol) {
            throw new Error("Market is required");
        }
        //@ts-ignore
        if (!interval || !bucketMap[interval]) {
            throw new Error(`Invalid interval. Valid intervals are: ${Object.keys(bucketMap).join(', ')}`);
        }

        if (!startTime || !endTime) {
            throw new Error("startTime and endTime are required");
        }
        //@ts-ignore
        const intervalMs = bucketMap[interval];
        const klines = await generateKlines(symbol.toString(), startTime, endTime, intervalMs);

        // Send response with metadata
        res.status(200).json({
            success: true,
            data: {
                klines,
                metadata: {
                    symbol,
                    interval,
                    startTime: new Date(Number(startTime)).toISOString(),
                    endTime: new Date(Number(endTime)).toISOString(),
                    totalKlines: klines.length
                }
            }
        });
    } catch (err: any) {
        console.error("Error generating klines:", err);
        res.status(500).json({
            success: false,
            error: err.message || "Internal server error",
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});