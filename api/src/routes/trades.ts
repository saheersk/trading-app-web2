import { Router } from "express";
import { getLast20TradesByStockId } from "../controller/tradeContoller";
import { RedisManager } from "../RedisManager";
import { GET_TRADE } from "../types";

export const tradesRouter = Router();


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

        // const response = await RedisManager.getInstance().sendAndAwait({
        //         type: GET_TRADE,
        //         data: {
        //             market: market as string
        //         }
        //     });
        
        // res.status(200).json(response.payload);

    } catch (err) {
        console.error("Error fetching last 20 trades:", err);
        res.status(500).send({ error: "Internal server error" });
    }
});

