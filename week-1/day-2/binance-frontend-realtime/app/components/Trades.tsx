"use client";

import { useEffect, useState } from "react";
import type { Trade } from "../utils/types";
import { getTrades } from "../utils/httpClient";
import { SignalingManager } from "../utils/SignalingManager";

export function Trades({ market }: { market: string }) {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch initial trades
                const initialTrades = await getTrades(market);
                setTrades(initialTrades.slice(0, 50).reverse());
                setLoading(false);
            } catch (err) {
                console.error("Error fetching trades:", err);
                setError("Unable to load trades");
                setLoading(false);
            }
        };

        init();

        // Subscribe to live trades
        SignalingManager.getInstance().registerCallback(
            "trade",
            (newTrade: Trade) => {
                setTrades((prevTrades) => {
                    const updated = [newTrade, ...prevTrades];
                    return updated.slice(0, 100); // Keep last 100 trades
                });
            },
            `TRADE-${market}`
        );

        SignalingManager.getInstance().sendMessage({
            method: "SUBSCRIBE",
            params: [`trade.${market}`],
        });

        return () => {
            SignalingManager.getInstance().deRegisterCallback(
                "trade",
                `TRADE-${market}`
            );
            SignalingManager.getInstance().sendMessage({
                method: "UNSUBSCRIBE",
                params: [`trade.${market}`],
            });
        };
    }, [market]);

    return (
        <div className="flex flex-col h-full bg-base-950 text-white">
            <div className="border-b border-slate-800 px-4 py-3">
                <h3 className="text-sm font-semibold">Recent Trades</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
                {error ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        {error}
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-base-900 border-b border-slate-800">
                            <tr className="text-slate-500 text-left">
                                <th className="px-3 py-2">Price</th>
                                <th className="px-3 py-2">Size</th>
                                <th className="px-3 py-2">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.length > 0 ? (
                                trades.map((trade, index) => (
                                    <tr
                                        key={`${trade.id}-${index}`}
                                        className={`border-b border-slate-900 hover:bg-slate-800 transition ${
                                            trade.isBuyerMaker ? "text-red-500" : "text-green-500"
                                        }`}
                                    >
                                        <td className="px-3 py-2 font-medium">
                                            {parseFloat(trade.price).toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2">
                                            {parseFloat(trade.quantity).toFixed(4)}
                                        </td>
                                        <td className="px-3 py-2 text-slate-400">
                                            {new Date(trade.timestamp).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                                        {loading ? "Loading trades..." : "No trades yet"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
