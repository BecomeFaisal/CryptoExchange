"use client";

import { useEffect, useMemo, useState } from "react";
import type { Ticker } from "../../utils/types";
import { getTickers } from "../../utils/httpClient";
import { SignalingManager } from "../../utils/SignalingManager";
import { MarketDetail } from "./MarketDetail";
import { useRouter } from "next/navigation";

export function MarketsList() {
    const [markets, setMarkets] = useState<Ticker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMarket, setSelectedMarket] = useState<Ticker | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [newsEnabled, setNewsEnabled] = useState<Record<string, boolean>>({});
    const router = useRouter();

    useEffect(() => {
        const fetchMarkets = async () => {
            try {
                const data = await getTickers();
                setMarkets(data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching markets:", err);
                setError("Failed to load markets");
                setLoading(false);
            }
        };

        fetchMarkets();

        SignalingManager.getInstance().registerCallback(
            "ticker",
            (updatedTicker: Partial<Ticker>) => {
                setMarkets((prevMarkets) =>
                    prevMarkets.map((m) =>
                        m.symbol === updatedTicker.symbol ? { ...m, ...updatedTicker } : m
                    )
                );
            },
            "MARKETS-TICKERS"
        );

        SignalingManager.getInstance().sendMessage({
            method: "SUBSCRIBE",
            params: ["ticker"],
        });

        return () => {
            SignalingManager.getInstance().deRegisterCallback("ticker", "MARKETS-TICKERS");
            SignalingManager.getInstance().sendMessage({
                method: "UNSUBSCRIBE",
                params: ["ticker"],
            });
        };
    }, []);

    useEffect(() => {
        const loadNewsAvailability = async () => {
            const topMarkets = markets
                .slice()
                .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume))
                .slice(0, 20);

            const results = await Promise.allSettled(
                topMarkets.map(async (market) => {
                    const symbol = market.symbol.split("_")[0];
                    const query = `${symbol} crypto news`;
                    const response = await fetch(`/api/proxy/news?query=${encodeURIComponent(query)}`);
                    if (!response.ok) {
                        return { symbol: market.symbol, available: false };
                    }
                    const data = await response.json();
                    const available = Array.isArray(data.articles) && data.articles.length > 0;
                    return { symbol: market.symbol, available };
                })
            );

            const updated: Record<string, boolean> = {};
            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    updated[result.value.symbol] = result.value.available;
                }
            });
            setNewsEnabled(updated);
        };

        if (markets.length > 0) {
            loadNewsAvailability();
        }
    }, [markets]);

    const popularMarkets = useMemo(() => {
        return markets
            .slice()
            .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume))
            .slice(0, 6)
            .filter((m) => m.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [markets, searchTerm]);

    const newsMarkets = useMemo(() => {
        return markets
            .filter((market) => {
                const isPopular = popularMarkets.some((popular) => popular.symbol === market.symbol);
                const hasNews = newsEnabled[market.symbol];
                return !isPopular && hasNews;
            })
            .filter((market) => market.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [markets, popularMarkets, newsEnabled, searchTerm]);

    const handleRowClick = (market: Ticker) => {
        setSelectedMarket(market);
    };

    const handleTradeClick = (market: Ticker) => {
        router.push(`/trade/${market.symbol}`);
    };

    return (
        <>
            <div className="flex flex-col h-full p-4 text-white">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold mb-4">Markets</h1>
                    <input
                        type="text"
                        placeholder="Search markets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-base-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center flex-1">
                        <div className="text-slate-400">Loading markets...</div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center flex-1">
                        <div className="text-red-400">{error}</div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold">Popular</h2>
                                    <p className="text-slate-500 text-sm">Top markets by volume</p>
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-slate-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-base-900 border-b border-slate-800 text-left text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3">Pair</th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3">24H Change</th>
                                            <th className="px-4 py-3">24H High</th>
                                            <th className="px-4 py-3">24H Low</th>
                                            <th className="px-4 py-3">Volume</th>
                                            <th className="px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {popularMarkets.length > 0 ? (
                                            popularMarkets.map((market) => (
                                                <tr
                                                    key={market.symbol}
                                                    className="border-b border-slate-800 hover:bg-slate-900 transition cursor-pointer"
                                                    onClick={() => handleRowClick(market)}
                                                >
                                                    <td className="px-4 py-3 font-medium">{market.symbol}</td>
                                                    <td className="px-4 py-3">${parseFloat(market.lastPrice).toFixed(2)}</td>
                                                    <td
                                                        className={`px-4 py-3 ${
                                                            Number(market.priceChange) > 0
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                        }`}
                                                    >
                                                        {Number(market.priceChange) > 0 ? "+" : ""}
                                                        {Number(market.priceChangePercent).toFixed(2)}%
                                                    </td>
                                                    <td className="px-4 py-3">${parseFloat(market.high).toFixed(2)}</td>
                                                    <td className="px-4 py-3">${parseFloat(market.low).toFixed(2)}</td>
                                                    <td className="px-4 py-3">${parseFloat(market.quoteVolume).toLocaleString()}</td>
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleTradeClick(market)}
                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition"
                                                        >
                                                            Trade
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-4 text-center text-slate-500">
                                                    No popular markets matched your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold">News-backed Markets</h2>
                                    <p className="text-slate-500 text-sm">Only markets with recent coverage</p>
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-slate-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-base-900 border-b border-slate-800 text-left text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3">Pair</th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3">24H Change</th>
                                            <th className="px-4 py-3">24H High</th>
                                            <th className="px-4 py-3">24H Low</th>
                                            <th className="px-4 py-3">Volume</th>
                                            <th className="px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newsMarkets.length > 0 ? (
                                            newsMarkets.map((market) => (
                                                <tr
                                                    key={market.symbol}
                                                    className="border-b border-slate-800 hover:bg-slate-900 transition cursor-pointer"
                                                    onClick={() => handleRowClick(market)}
                                                >
                                                    <td className="px-4 py-3 font-medium">{market.symbol}</td>
                                                    <td className="px-4 py-3">${parseFloat(market.lastPrice).toFixed(2)}</td>
                                                    <td
                                                        className={`px-4 py-3 ${
                                                            Number(market.priceChange) > 0
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                        }`}
                                                    >
                                                        {Number(market.priceChange) > 0 ? "+" : ""}
                                                        {Number(market.priceChangePercent).toFixed(2)}%
                                                    </td>
                                                    <td className="px-4 py-3">${parseFloat(market.high).toFixed(2)}</td>
                                                    <td className="px-4 py-3">${parseFloat(market.low).toFixed(2)}</td>
                                                    <td className="px-4 py-3">${parseFloat(market.quoteVolume).toLocaleString()}</td>
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleTradeClick(market)}
                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition"
                                                        >
                                                            Trade
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-4 text-center text-slate-500">
                                                    No news-backed markets found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {selectedMarket && (
                <MarketDetail
                    market={selectedMarket}
                    onClose={() => setSelectedMarket(null)}
                    onTrade={() => {
                        handleTradeClick(selectedMarket);
                        setSelectedMarket(null);
                    }}
                />
            )}
        </>
    );
}
