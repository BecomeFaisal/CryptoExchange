export async function GET() {
    try {
        const response = await fetch('https://api.backpack.exchange/api/v1/tickers', {
            headers: {
                'Accept': 'application/json',
            },
        });
        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return Response.json({ error: 'Failed to fetch tickers' }, { status: 500 });
    }
}
