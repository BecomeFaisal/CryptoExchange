"use client";

import { useEffect, useState } from "react";
import type { Ticker } from "../../utils/types";

interface NewsArticle {
    title: string;
    description: string;
    url: string;
    image?: string;
    publishedAt: string;
    source: {
        name: string;
    };
}

export function MarketDetail({
    market,
    onClose,
    onTrade,
}: {
    market: Ticker;
    onClose: () => void;
    onTrade: () => void;
}) {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [newsError, setNewsError] = useState<string | null>(null);

    const formattedPair = market.symbol
        .replace(/_PERP$/i, "")
        .split("_")
        .join(" / ");

    const marketType = market.symbol.endsWith("_PERP") ? "Perpetual" : "Spot";

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const cryptoName = market.symbol.split("_")[0];
                const response = await fetch(
                    `/api/proxy/news?query=${encodeURIComponent(cryptoName + " crypto news")}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setNews(data.articles || []);
                } else {
                    setNewsError("Unable to load news");
                }
                setLoadingNews(false);
            } catch (error) {
                console.error("Error fetching news:", error);
                setNewsError("Failed to load news");
                setLoadingNews(false);
            }
        };

        fetchNews();
    }, [market.symbol]);

    const changePercent = Number(market.priceChangePercent);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-950 border border-slate-700 rounded-lg flex flex-col h-[90vh] max-w-4xl w-full text-white">
                {/* Header */}
                <div className="border-b border-slate-700 p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                {marketType}
                            </p>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {formattedPair}
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                            <span className="text-sm text-slate-400">Last price</span>
                            <span className="text-xl text-green-500 font-semibold">
                                ${parseFloat(market.lastPrice).toFixed(2)}
                            </span>
                            <span
                                className={`text-sm px-2 py-1 rounded ${
                                    changePercent > 0
                                        ? "bg-green-900/30 text-green-400"
                                        : "bg-red-900/30 text-red-400"
                                }`}
                            >
                                {changePercent > 0 ? "+" : ""}
                                {changePercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Summary Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-base-900 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm mb-2">24H High</p>
                            <p className="text-xl font-bold">
                                ${parseFloat(market.high).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-base-900 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm mb-2">24H Low</p>
                            <p className="text-xl font-bold">
                                ${parseFloat(market.low).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-base-900 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm mb-2">24H Volume</p>
                            <p className="text-xl font-bold">
                                ${parseInt(market.quoteVolume).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-base-900 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm mb-2">Trades</p>
                            <p className="text-xl font-bold">{market.trades}</p>
                        </div>
                    </div>

                    {/* News Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Related News</h3>
                        {loadingNews ? (
                            <div className="text-slate-400">Loading news...</div>
                        ) : newsError ? (
                            <div className="text-slate-400">{newsError}</div>
                        ) : news.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {news.slice(0, 5).map((article, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 backdrop-blur-xl shadow-sm"
                                    >
                                        {article.image ? (
                                            <div className="h-40 overflow-hidden">
                                                <img
                                                    src={article.image}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : null}
                                        <div className="p-4 bg-slate-950/70 backdrop-blur-md">
                                            <p className="font-semibold text-white mb-2">
                                                {article.title}
                                            </p>
                                            <p className="text-sm text-slate-300 mb-3 line-clamp-3">
                                                {article.description || "No summary available."}
                                            </p>
                                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 mb-3">
                                                <span>{article.source.name}</span>
                                                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                            </div>
                                            <a
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition"
                                            >
                                                Read full article
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-slate-400">No news available</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-700 p-4 flex gap-3">
                    <button
                        onClick={onTrade}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition"
                    >
                        Trade {market.symbol}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
