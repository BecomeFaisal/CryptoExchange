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

    const [baseCurrency, quoteCurrency] = market.symbol.replace(/_PERP$/i, "").split("_");
    const pairLabel = `${baseCurrency} / ${quoteCurrency}`;
    const marketType = market.symbol.endsWith("_PERP") ? "Perpetual market" : "Spot market";
    const pairSubtitle = `${quoteCurrency} quote${market.symbol.endsWith("_PERP") ? " · Perpetual" : ""}`;
    const changePercent = Number(market.priceChangePercent);
    const changeIsPositive = changePercent >= 0;
    const changeArrow = changeIsPositive ? "▲" : "▼";

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

    return (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-950 border border-slate-800 rounded-[28px] flex flex-col h-[90vh] max-w-4xl w-full text-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900/95 border-b border-slate-800 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                {marketType}
                            </p>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {pairLabel}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {pairSubtitle}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                            <span className="text-sm text-slate-400">Last price</span>
                            <span className="text-3xl font-bold text-white">
                                ${parseFloat(market.lastPrice).toFixed(2)}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${
                                    changeIsPositive
                                        ? "bg-emerald-900/60 text-emerald-300"
                                        : "bg-rose-900/60 text-rose-300"
                                }`}
                            >
                                {changeArrow} {Math.abs(changePercent).toFixed(2)}%
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Summary Section */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="bg-slate-900/95 p-4 rounded-3xl shadow-md border border-slate-800">
                            <p className="text-slate-400 text-sm mb-2">24H High</p>
                            <p className="text-xl font-bold">
                                ${parseFloat(market.high).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-slate-900/95 p-4 rounded-3xl shadow-md border border-slate-800">
                            <p className="text-slate-400 text-sm mb-2">24H Low</p>
                            <p className="text-xl font-bold">
                                ${parseFloat(market.low).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-slate-900/95 p-4 rounded-3xl shadow-md border border-slate-800">
                            <p className="text-slate-400 text-sm mb-2">24H Change</p>
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${
                                changeIsPositive
                                    ? "bg-emerald-900/60 text-emerald-300"
                                    : "bg-rose-900/60 text-rose-300"
                            }`}>
                                <span>{changeArrow}</span>
                                <span>{Math.abs(changePercent).toFixed(2)}%</span>
                            </div>
                        </div>
                        <div className="bg-slate-900/95 p-4 rounded-3xl shadow-md border border-slate-800">
                            <p className="text-slate-400 text-sm mb-2">24H Volume</p>
                            <p className="text-xl font-bold">
                                ${parseInt(market.quoteVolume).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-slate-900/95 p-4 rounded-3xl shadow-md border border-slate-800 sm:col-span-2">
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
                            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                                {news.slice(0, 5).map((article, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-xl"
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
                                        <div className="p-4 bg-slate-950">
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
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded transition"
                    >
                        Trade {pairLabel}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded transition"
                    >
                        Close
                    </button>
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(148, 163, 184, 0.75) transparent;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(100, 116, 139, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.75);
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.95);
                }
            `}</style>
        </div>
    );
}
