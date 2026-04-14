import { useEffect, useRef, useState } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines } from "../utils/httpClient";
import type { KLine } from "../utils/types";
import { SignalingManager } from "../utils/SignalingManager";

export function TradeView({
  market,
}: {
  market: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let klineData: KLine[] = [];
        try {
          klineData = await getKlines(
            market,
            "1h",
            Math.floor((new Date().getTime() - 1000 * 60 * 60 * 24 * 7) / 1000),
            Math.floor(new Date().getTime() / 1000)
          );
        } catch (e) {
          console.error("Error fetching klines:", e);
          setError("Unable to load chart data");
        }

        if (chartRef.current) {
          if (chartManagerRef.current) {
            chartManagerRef.current.destroy();
          }

          const chartData = klineData?.map((x) => ({
            close: parseFloat(x.close),
            high: parseFloat(x.high),
            low: parseFloat(x.low),
            open: parseFloat(x.open),
            timestamp: new Date(x.end),
          })).sort((x, y) => (x.timestamp < y.timestamp ? -1 : 1)) || [];

          const chartManager = new ChartManager(
            chartRef.current,
            chartData,
            {
              background: "#0e0f14",
              color: "white",
            }
          );
          chartManagerRef.current = chartManager;

          // Subscribe to live candle updates
          SignalingManager.getInstance().registerCallback(
            "candle",
            (candleData: any) => {
              if (chartManagerRef.current) {
                chartManagerRef.current.update({
                  open: parseFloat(candleData.open),
                  high: parseFloat(candleData.high),
                  low: parseFloat(candleData.low),
                  close: parseFloat(candleData.close),
                  time: candleData.time,
                  newCandleInitiated: candleData.isClosed,
                });
              }
            },
            `CANDLE-${market}`
          );

          SignalingManager.getInstance().sendMessage({
            method: "SUBSCRIBE",
            params: [`candle.1h.${market}`],
          });

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Chart initialization error:", err);
        setError("Failed to initialize chart");
        setIsLoading(false);
      }
    };

    init();

    return () => {
      try {
        SignalingManager.getInstance().deRegisterCallback(
          "candle",
          `CANDLE-${market}`
        );
        SignalingManager.getInstance().sendMessage({
          method: "UNSUBSCRIBE",
          params: [`candle.1h.${market}`],
        });
      } catch (err) {
        console.error("Error during cleanup:", err);
      }
    };
  }, [market]);

  return (
    <>
      <div className="relative w-full" style={{ height: "520px", marginTop: 4 }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-950 rounded">
            <div className="text-slate-400">Loading chart...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-950 rounded">
            <div className="text-red-400">{error}</div>
          </div>
        )}
        <div ref={chartRef} style={{ height: "100%", width: "100%" }}></div>
      </div>
    </>
  );
}


