const axios = require('axios');

class StockService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiration = 30 * 1000;
    }
    #calculateSMA(prices, period) {
        if (!prices || prices.length < period) return null;
        const sum = prices.slice(-period).reduce((acc, val) => acc + val, 0);
        return sum / period;
    }
    #calculateRSI(prices, period = 14) {
        if (!prices || prices.length <= period) return null;
        let gains = 0, losses = 0, avgGain = 0, avgLoss = 0;
        for (let i = 1; i <= period; i++) {
            const difference = prices[i] - prices[i - 1];
            if (difference >= 0) { gains += difference; } else { losses -= difference; }
        }
        avgGain = gains / period;
        avgLoss = losses / period;
        for (let i = period + 1; i < prices.length; i++) {
            const difference = prices[i] - prices[i - 1];
            if (difference >= 0) { gains = difference; losses = 0; } else { gains = 0; losses = -difference; }
            avgGain = (avgGain * (period - 1) + gains) / period;
            avgLoss = (avgLoss * (period - 1) + losses) / period;
        }
        if (avgLoss === 0) return 100;
        const relativeStrength = avgGain / avgLoss;
        return 100 - (100 / (1 + relativeStrength));
    }
    async getStockData(symbol) {
        const cacheKey = symbol;
        const now = Date.now();
        const cachedItem = this.cache.get(cacheKey);
        if (cachedItem && (now - cachedItem.timestamp < this.cacheExpiration)) {
            return cachedItem.data;
        }
        const token = process.env.BRAPI_API_TOKEN;
        const quoteUrl = `https://brapi.dev/api/quote/${symbol}?token=${token}`;
        const historicalUrl = `https://brapi.dev/api/quote/${symbol}?range=3mo&interval=1d&token=${token}`;
        try {
            const [quoteResponse, historicalResponse] = await Promise.all([
                axios.get(quoteUrl, { timeout: 25000 }),
                axios.get(historicalUrl, { timeout: 25000 })
            ]);
            const quoteData = quoteResponse.data?.results?.[0];
            const historicalData = historicalResponse.data?.results?.[0];
            if (!quoteData) { throw new Error(`Dados de cotação não encontrados para ${symbol}`); }

            const historicalPrices = historicalData?.historicalDataPrice?.map(p => p.close) || [];
            const sma20 = this.#calculateSMA(historicalPrices, 20);
            const rsi14 = this.#calculateRSI(historicalPrices, 14);
            const change = quoteData.regularMarketChange || 0;

            const processedData = {
                symbol: quoteData.symbol, name: quoteData.longName, price: quoteData.regularMarketPrice,
                change: change, changePercent: quoteData.regularMarketChangePercent || 0,
                volume: quoteData.regularMarketVolume, high: quoteData.regularMarketDayHigh, low: quoteData.regularMarketDayLow,
                previousClose: quoteData.regularMarketPrice - change,
                lastUpdate: new Date(quoteData.regularMarketTime).toISOString(),
                marketCap: quoteData.marketCap, sma20: sma20, rsi14: rsi14,
            };
            this.cache.set(cacheKey, { timestamp: now, data: processedData });
            return processedData;
        } catch (error) {
            console.error(`Falha ao buscar dados da ação ${symbol}:`, error.message);
            throw error;
        }
    }
    async getStockHistoricalData(symbol, range) {
        try {
            const token = process.env.BRAPI_API_TOKEN;
            const url = `https://brapi.dev/api/quote/${symbol}?range=${range}&interval=1d&token=${token}`;
            const response = await axios.get(url, { timeout: 25000 });
            const result = response.data?.results?.[0];
            if (!result || !result.historicalDataPrice) { throw new Error(`Dados históricos não encontrados para ${symbol}`); }
            
            const formattedData = result.historicalDataPrice.map(point => ({
                date: new Date(point.date * 1000).toISOString(),
                price: point.close
            }));
            return formattedData;
        } catch (error) {
            console.error(`❌ [SERVICE] ERRO ao buscar dados históricos para ${symbol}:`, error.message);
            throw error;
        }
    }
}

module.exports = new StockService();