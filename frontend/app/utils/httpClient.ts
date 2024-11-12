import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";


const BASE_URL = "http://localhost:3000/api/v1";

export async function getTicker(market: string): Promise<Ticker> {
    const tickers = await getTickers();

    // console.log(tickers, "ticker Response============");

    // const ticker = tickers.find(t => t.symbol === market);
    if (!tickers) {
        throw new Error(`No ticker found for ${market}`);
    }
    //@ts-ignore
    return tickers;
}

export async function getTickers(): Promise<Ticker[]> {
    const response = await axios.get(`${BASE_URL}/tickers?market=TATA_INR`);
    console.log(response.data.data, "ticker Response============");
    return response.data.data;
}


export async function getDepth(market: string): Promise<Depth> {
    const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
    console.log(response, "depth Response============");

    return response.data;
}
export async function getTrades(market: string): Promise<Trade[]> {
    const response = await axios.get(`${BASE_URL}/trades?market=TATA_INR`);
    console.log(response.data, "trades Response============");
    
    return response.data;
}

export async function getKlines(market: string, interval: string, startTime: number, endTime: number): Promise<KLine[]> {
    const response = await axios.get(`${BASE_URL}/klines?market=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`);
    // console.log(response.data.data, "klines Response============");

    const data: KLine[] = response.data.data.klines;
    return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}
