import { useEffect, useRef } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines } from "../utils/httpClient";
import { KLine } from "../utils/types";

// export function TradeView({
//   market,
// }: {
//   market: string;
// }) {
//   const chartRef = useRef<HTMLDivElement>(null);
//   const chartManagerRef = useRef<ChartManager>(null);

//   useEffect(() => {
//     const init = async () => {
//       let klineData: KLine[] = [];
//       try {
//         klineData = await getKlines(market, "1h", Math.floor((new Date().getTime() - 1000 * 60 * 60 * 24 * 7) / 1000), Math.floor(new Date().getTime() / 1000)); 
//       } catch (e) { }

//       if (chartRef) {
//         if (chartManagerRef.current) {
//           chartManagerRef.current.destroy();
//         }
//         console.log(klineData, 'kline in fe==============')
  
//         const chartManager = new ChartManager(
//           chartRef.current,
//           [
//             ...klineData?.map((x: any) => {
//               const timestamp = new Date(x.timestamp).getTime();
//               // console.log(timestamp, "===================timestamp");
//               // console.log(x.close, "===================close");
//               return {
//                   close: parseFloat(x.close),
//                   high: parseFloat(x.high),
//                   low: parseFloat(x.low),
//                   open: parseFloat(x.open),
//                   volume: parseFloat(x.volume),
//                   trades: x.trades,
//                   timestamp, // Timestamp in milliseconds
//               };
//           })
//         ].sort((a, b) => a.timestamp - b.timestamp) || [] ,
//           {
//             background: "#0e0f14",
//             color: "white",
//           }
//         );
//         //@ts-ignore
//         chartManagerRef.current = chartManager;
//       }
//     };
//     init();
//   }, [market, chartRef]);

//   return (
//     <>
//       <div ref={chartRef} style={{ height: "520px", width: "100%", marginTop: 4 }}></div>
//     </>
//   );
// }


import { SignalingManager } from "../utils/SignalingManager";

export function TradeView({
  market,
}: {
  market: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);
  // const klineDataRef = useRef<KLine[]>([]);
  const klineDataRef = useRef<any>([]);

  useEffect(() => {
    const fetchInitialKlines = async () => {
      try {
        const klineData = await getKlines(
          market,
          "1h",
          Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 7) / 1000),
          Math.floor(Date.now() / 1000)
        );
        console.log(klineData, 'kline in fe==============')
        klineDataRef.current = klineData.map((x) => ({
          close: parseFloat(x.close),
          high: parseFloat(x.high),
          low: parseFloat(x.low),
          open: parseFloat(x.open),
          volume: parseFloat(x.volume),
          trades: x.trades,
          timestamp: new Date(x.timestamp).getTime(), // Timestamp in ms
        })).sort((a, b) => a.timestamp - b.timestamp);

        if (chartRef.current) {
          if (chartManagerRef.current) {
            chartManagerRef.current.destroy();
          }
          chartManagerRef.current = new ChartManager(chartRef.current, klineDataRef.current, {
            background: "#0e0f14",
            color: "white",
          });
        }
      } catch (error) {
        console.error("Failed to fetch Kline data:", error);
      }
    };

    fetchInitialKlines();

   
    // Real-time updates using SignalingManager
    const signalingManager = SignalingManager.getInstance();

    const tradeCallback = (data: any) => {
      console.log(data, "tradeCallback=======");
      const parsedTrade = {
        timestamp: data.timestamp, 
        price: parseFloat(data.price),
        volume: parseFloat(data.volume),
      };
      updateChartWithNewTrade(parsedTrade);
    };

    signalingManager.registerCallback("trade", tradeCallback, `TRADE-${market}`);
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

  const updateChartWithNewTrade = (newTrade: { timestamp: number; price: number; volume: number }) => {
    console.log('newTrade.timestamp', newTrade.timestamp); // Add this line

  // Check if it's a valid ISO string
  const timestampInMillis = new Date(newTrade.timestamp).getTime();
  console.log('timestampInMillis', timestampInMillis); // Add this line to see the result of new Date()

  const interval = 60 * 60 * 1000; // 1 hour in milliseconds
  const bucketStartTime = Math.floor(timestampInMillis / interval) * interval;

  console.log({ newTradeTimestamp: newTrade.timestamp, bucketStartTime }, "Timestamp Debug");


    let updated = false;
  
  // Update or create the candle
  klineDataRef.current = klineDataRef.current.map((kline) => {
    // Check if the kline already exists with the same timestamp
    if (kline.timestamp === bucketStartTime) {
      updated = true;
      return {
        ...kline,
        high: Math.max(kline.high, newTrade.price),
        low: Math.min(kline.low, newTrade.price),
        close: newTrade.price,
        volume: kline.volume + newTrade.volume,
        trades: kline.trades + 1,
      };
    }
    return kline;
  });

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

  // Sort the candles to maintain order
  klineDataRef.current.sort((a, b) => a.timestamp - b.timestamp);
  console.log(klineDataRef.current, "Sorted Klines Debug");

  // Update the chart with the modified candles
  if (chartManagerRef.current) {
    const updatedCandle = klineDataRef.current.find(
      (kline) => kline.timestamp === bucketStartTime
    );
    console.log(updatedCandle, 'updatedCandle in updateChartWithNewTrade==============');
    if (updatedCandle) {
      chartManagerRef.current.update({
        time: updatedCandle.timestamp / 1000, // Convert to seconds for Lightweight Charts
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
    <div
      ref={chartRef}
      style={{ height: "520px", width: "100%", marginTop: 4 }}
    ></div>
  );
}
