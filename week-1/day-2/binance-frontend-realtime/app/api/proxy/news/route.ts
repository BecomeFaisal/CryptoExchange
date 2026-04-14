export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        
        if (!query) {
            return Response.json({ error: 'query parameter required' }, { status: 400 });
        }

        // Using NewsAPI.org free tier
        const newsApiKey = process.env.NEWS_API_KEY;
        const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=10${newsApiKey ? `&apiKey=${newsApiKey}` : ''}`;
        
        const response = await fetch(newsUrl, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn('News API error:', response.status);
            const fallbackArticles = [
                {
                    title: `Latest ${query} updates`,
                    description: `Crypto news is currently unavailable. Here is a fallback summary for ${query}.`,
                    url: 'https://www.coindesk.com',
                    image: 'https://images.unsplash.com/photo-1611078486207-0d0f2e9d29ef?auto=format&fit=crop&w=1200&q=80',
                    publishedAt: new Date().toISOString(),
                    source: { name: 'Crypto News' },
                },
                {
                    title: `Market sentiment for ${query}`,
                    description: `This fallback story summarizes recent market sentiment for ${query}.`,
                    url: 'https://www.coindesk.com',
                    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    publishedAt: new Date().toISOString(),
                    source: { name: 'Market Pulse' },
                },
            ];
            return Response.json({ articles: fallbackArticles });
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error('News proxy error:', error);
        // Graceful fallback
        return Response.json({ articles: [] });
    }
}
