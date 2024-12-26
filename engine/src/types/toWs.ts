
export type TickerUpdateMessage = {
    stream: string, 
    data: {
        c?: any,
        h?: any,
        l?: any,
        v?: any,
        V?: any,
        s?: any,
        id?: number,
        e: "ticker"
    }
}

export type DepthUpdateMessage = {
    stream: any,
    data: {
        b?: [string, string][],
        a?: [string, string][],
        e: "depth"
    }
}

export type TradeAddedMessage = {
    stream: string,
    data: {
        e: "trade",
        i: number,
        m: boolean,
        p: number,
        q: number,
        s: string, // symbol
        t: any,
        ts: string
    }
}

export type WsMessage = TickerUpdateMessage | DepthUpdateMessage | TradeAddedMessage;
