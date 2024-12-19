import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS, GET_TRADE } from "."


export type MessageToEngine = {
    type: typeof CREATE_ORDER,
    data: {
        market: string,
        price: string,
        quantity: string,
        side: "buy" | "sell",
        userId: string
    }
} | {
    type: typeof CANCEL_ORDER,
    data: {
        orderId: string,
        market: string
    }
} | {
    type: typeof GET_OPEN_ORDERS,
    data: {
        userId: string,
        market: string
    }
} | {
    type: typeof GET_DEPTH,
    data: {
        market: string,
    }
} | {
    type: typeof GET_TRADE,
    data: any
}

export type CreateOrderMessage = {
    type: typeof CREATE_ORDER;
    data: {
        market: string;
        price: string;
        quantity: string;
        side: "buy" | "sell";
        userId: string;
    };
};

export type CancelOrderMessage = {
    type: typeof CANCEL_ORDER;
    data: {
        orderId: string;
        market: string;
    };
};

export type GetOpenOrdersMessage = {
    type: typeof GET_OPEN_ORDERS;
    data: {
        userId: string;
        market: string;
    };
};