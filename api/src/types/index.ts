export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";
export const GET_DEPTH = "GET_DEPTH";
export const GET_TRADE = "GET_TRADE";

export type MessageFromOrderbook = {
    type: "DEPTH",
    payload: {
        market: string,
        bids: [string, string][],
        asks: [string, string][]
    }
} | { 
    type: "ORDER_PLACED",
    payload: {
        orderId: string,
        executedQty: number,
        fills: [
            {
                price: number,
                qty: number,
                tradeId: string
            }
        ]
    }
} | {
    type: "ORDER_CANCELLED",
    payload: {
        orderId: string,
        executedQty: number,
        remainingQty: number
    }
} | {
    type: "OPEN_ORDERS",
    payload: {
        orderId: string,
        executedQty: number,
        price: string,
        quantity: string,
        side: "buy" | "sell",
        userId: string
    }
}


export type CreateOrderResponse = {
    type: "ORDER_PLACED";
    payload: {
        orderId: string;
        executedQty: number;
        fills: {
            price: number;
            qty: number;
            tradeId: string;
        }[];
    };
};

export type DepthMessage = {
    type: "DEPTH";
    payload: {
        market: string;
        bids: [string, string][];
        asks: [string, string][];
    };
};

export type OrderPlacedMessage = {
    type: "ORDER_PLACED";
    payload: {
        orderId: string;
        executedQty: number;
        fills: {
            price: number;
            qty: number;
            tradeId: string;
        }[];
    };
};

export type OrderCancelledMessage = {
    type: "ORDER_CANCELLED";
    payload: {
        orderId: string;
        executedQty: number;
        remainingQty: number;
    };
};

export type OpenOrdersMessage = {
    type: "OPEN_ORDERS";
    payload: {
        orderId: string;
        executedQty: number;
        price: string;
        quantity: string;
        side: "buy" | "sell";
        userId: string;
    };
};
