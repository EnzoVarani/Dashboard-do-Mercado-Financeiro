const stockService = require('../services/stockService');

class StockController {
    async getStockData(req, res) {
        try {
            const { symbol } = req.params;
            if (!symbol) { return res.status(400).json({ error: 'Símbolo da ação é obrigatório' }); }
            const normalizedSymbol = symbol.toUpperCase();
            const stockData = await stockService.getStockData(normalizedSymbol);
            res.json({ success: true, data: stockData });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    async getMultipleStocks(req, res) {
        try {
            const { symbols } = req.query;
            if (!symbols) { return res.status(400).json({ error: 'Parâmetro symbols é obrigatório' }); }
            const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
            if (symbolList.length > 10) { return res.status(400).json({ error: 'Máximo 10 ações por requisição' }); }
            
            const promises = symbolList.map(symbol =>
                stockService.getStockData(symbol).catch(error => ({
                    symbol, error: error.message, success: false
                }))
            );

            const results = await Promise.all(promises);
            res.json({
                success: true,
                data: results.filter(r => r.success !== false),
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getStockHistoricalData(req, res) {
        try {
            const { symbol } = req.params;
            const { range = '1mo' } = req.query;
            const historicalData = await stockService.getStockHistoricalData(symbol, range);
            res.json({ success: true, data: historicalData });
        } catch (error) {
            console.error('❌ [CONTROLLER] Erro ao buscar dados históricos:', error.message);
            res.status(500).json({ success: false, message: 'Não foi possível obter os dados históricos da ação' });
        }
    }
}

module.exports = new StockController();