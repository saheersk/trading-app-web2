import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";


const BASE_URL = "http://localhost:3000/api/v1";

export async function getTicker(market: string): Promise<Ticker> {
    const tickers = await getTickers(market);

    if (!tickers) {
        throw new Error(`No ticker found for ${market}`);
    }
    //@ts-ignore
    return tickers;
}

export async function getTickers(market: any): Promise<Ticker[]> {
    const response = await axios.get(`${BASE_URL}/tickers?market=${market}`);
    return response.data.data;
}


export async function getDepth(market: string): Promise<Depth> {
    const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
    return response.data;
}
export async function getTrades(market: string): Promise<Trade[]> {
    const response = await axios.get(`${BASE_URL}/trades?market=${market}`);
    return response.data;
}

export async function getKlines(market: string, interval: string, startTime: number, endTime: number): Promise<KLine[]> {
    const response = await axios.get(`${BASE_URL}/k-lines?market=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`);
    const data: KLine[] = response.data.data.klines;
    return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}

export async function getMarket(): Promise<any> {
    const response = await axios.get(`${BASE_URL}/markets`);
    const data: any = response.data;
    return data;
}