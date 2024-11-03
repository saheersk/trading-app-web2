import { Request, Response, Router } from "express";
import { RedisManager } from "../RedisManager";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS } from "../types";


export const orderRouter = Router();


orderRouter.post("/", async (req: any, res: any) => {
    const { market, price, quantity, side, userId } = req.body;
    console.log({ market, price, quantity, side, userId }, "Order======");
    
    try {
        const response = await RedisManager.getInstance().sendAndAwait({
            type: CREATE_ORDER,
            data: { market, price, quantity, side, userId },
        });
        console.log(response, "Create======");
        return res.status(200).json(response.payload);
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ error: "Internal server error" });
    }

});

orderRouter.delete("/", async (req: Request, res: Response) => {
    const { orderId, market } = req.body;

    const response = await RedisManager.getInstance().sendAndAwait({
        type: CANCEL_ORDER,
        data: {
            orderId,
            market,
        },
    });
    console.log(response, "order delete===")
    res.status(200).json(response.payload);
});

orderRouter.get("/open", async (req: Request, res: Response) => {
    console.log(req.query, "open query===")
    const response = await RedisManager.getInstance().sendAndAwait({
        type: GET_OPEN_ORDERS,
        data: {
            userId: req.query.userId as string,
            market: req.query.market as string,
        },
    });
    console.log(response, "order open===")
    res.json(response.payload);
});
