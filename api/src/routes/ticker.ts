import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { get24hMetricsDetails } from "../controller/trickerController";


export const tickersRouter = Router();

//@ts-ignore
tickersRouter.get("/", async (req, res) => {
    const { market }: any = req.query;

    const symbol = market.split("_")[0];

    console.log("symbol: ", symbol, "====================")

    if (!symbol) {
        return res.status(400).json({ error: "Missing Market parameter" });
    }

    try {
        // const stockIdNum = symbol;
        // if (isNaN(stockIdNum)) {
        //     return res.status(400).json({ error: 'Invalid stockId. Must be a number.' });
        // }

        const metrics = await get24hMetricsDetails(symbol.toString());

        // Add debug information in development
        const response = {
            success: true,
            data: metrics,
            debug:
                process.env.NODE_ENV === "development"
                    ? {
                          queryTimeRange: {
                              start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                              end: new Date().toISOString(),
                          },
                      }
                    : undefined,
        };

        res.status(200).json(response);
    } catch (err: any) {
        console.error("Error fetching 24h metrics:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            details: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }
});