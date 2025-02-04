import { useEffect, useRef, useState } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines } from "../utils/httpClient";
import { KLine } from "../utils/types";
import { SignalingManager } from "../utils/SignalingManager";

export function TradeView({ market }: { market: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);
  // const klineDataRef = useRef<KLine[]>([]);
  const klineDataRef = useRef<any>([]);
  const [klineTime, setKlineTime] = useState("1h");
  const [loading, setLoading] = useState(false);

  const fetchInitialKlines = async () => {
    setLoading(true);
    try {
      const klineData = await getKlines(
        market,
        klineTime,
        Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 7) / 1000),
        Math.floor(Date.now() / 1000)
      );

      klineDataRef.current = klineData
        .map((x) => ({
          close: parseFloat(x.close),
          high: parseFloat(x.high),
          low: parseFloat(x.low),
          open: parseFloat(x.open),
          volume: parseFloat(x.volume),
          trades: x.trades,
          //@ts-ignore
          timestamp: new Date(x?.timestamp).getTime(),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      if (chartRef.current) {
        if (chartManagerRef.current) {
          chartManagerRef.current.destroy();
        }
        //@ts-ignore
        chartManagerRef.current = new ChartManager(
          chartRef.current,
          klineDataRef.current,
          {
            background: "#0e0f14",
            color: "white",
          }
        );
      }
    } catch (error) {
      console.error("Failed to fetch Kline data:", error);
    }finally {
      setLoading(false);
    }
  };


  useEffect(() => {
  
    fetchInitialKlines();

    // Real-time updates using SignalingManager
    const signalingManager = SignalingManager.getInstance();

    const tradeCallback = (data: any) => {
      const parsedTrade = {
        timestamp: data.timestamp,
        price: parseFloat(data.price),
        volume: parseFloat(data.volume),
      };
      updateChartWithNewTrade(parsedTrade);
    };

    signalingManager.registerCallback(
      "trade",
      tradeCallback,
      `TRADE-${market}`
    );
    signalingManager.sendMessage({
      method: "SUBSCRIBE",
      params: [`trade@${market}`],
    });

    return () => {
      signalingManager.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`trade@${market}`],
      });
      signalingManager.deRegisterCallback("trade", `TRADE-${market}`);
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
      }
    };
  }, [market]);

  useEffect(() => {
    fetchInitialKlines();
  }, [klineTime]);

  const updateChartWithNewTrade = (newTrade: {
    timestamp: number;
    price: number;
    volume: number;
  }) => {
    console.log("New trade received:", newTrade);

    // Convert timestamp to milliseconds and calculate bucket start time
    const timestampInMillis = new Date(newTrade.timestamp).getTime();
    const interval = 60 * 60 * 1000; // 1 hour in milliseconds
    const bucketStartTime = Math.floor(timestampInMillis / interval) * interval;

    console.log(
      {
        newTradeTimestamp: newTrade.timestamp,
        bucketStartTime,
        timestampInMillis,
      },
      "Timestamp Debug"
    );

    let updated = false;

    if (
      klineDataRef.current.length > 0 &&
      (klineDataRef.current[klineDataRef.current.length - 1].timestamp ===
        bucketStartTime ||
        (bucketStartTime -
          klineDataRef.current[klineDataRef.current.length - 1].timestamp <
          60 * 60 * 1000 &&
          bucketStartTime -
            klineDataRef.current[klineDataRef.current.length - 1].timestamp >=
            0))
    ) {
      const lastKline = klineDataRef.current[klineDataRef.current.length - 1];
      // Update the last candle
      klineDataRef.current[klineDataRef.current.length - 1] = {
        ...lastKline,
        high: Math.max(lastKline.high, newTrade.price),
        low: Math.min(lastKline.low, newTrade.price),
        close: newTrade.price,
        volume: lastKline.volume + newTrade.volume,
        trades: lastKline.trades + 1,
      };
      updated = true;
    }

    // If no matching candle, create a new one
    if (!updated) {
      klineDataRef.current.push({
        timestamp: bucketStartTime,
        open: newTrade.price,
        high: newTrade.price,
        low: newTrade.price,
        close: newTrade.price,
        volume: newTrade.volume,
        trades: 1,
      });
    }

    // Ensure the candles remain sorted by timestamp
    klineDataRef.current.sort((a: any, b: any) => a.timestamp - b.timestamp);

    // Update the chart with the modified data
    if (chartManagerRef.current) {
      const updatedCandle = klineDataRef.current.find(
        (kline: any) => kline.timestamp === bucketStartTime
      );

      if (updatedCandle) {
        chartManagerRef.current.update({
          time: updatedCandle.timestamp / 1000,
          open: updatedCandle.open,
          high: updatedCandle.high,
          low: updatedCandle.low,
          close: updatedCandle.close,
          newCandleInitiated: !updated,
        });
      }
    }
  };

  return (
    <div className="w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-20">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full animate-bounce bg-blue-500"></div>
            <div className="w-4 h-4 rounded-full animate-bounce bg-green-500"></div>
            <div className="w-4 h-4 rounded-full animate-bounce bg-red-500"></div>
          </div>

        </div>
      )}
      <div
        ref={chartRef}
        style={{ height: "520px", width: "100%" }} 
        className="relative w-full"
      >
        <div className="absolute top-0 left-0 w-full p-2 z-10">
          <label
            htmlFor="timePeriod"
            className="block text-xs text-slate-400 font-medium"
          >
            Select Time Period
          </label>
          <select
            id="timePeriod"
            className="mt-1 p-2 text-base bg-slate-700 border border-slate-600 rounded-md"
            value={klineTime}
            onChange={(e) => setKlineTime(e.target.value)}
          >
            <option value="1m">1 Month</option>
            <option value="5m">5 Month</option>
            <option value="15m">15 Month</option>
            <option value="30m">30 Month</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
          </select>
        </div>
      </div>
    </div>
  );
}
