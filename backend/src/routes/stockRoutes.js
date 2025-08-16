const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/multiple', (req, res) => stockController.getMultipleStocks(req, res));
router.get('/:symbol', (req, res) => stockController.getStockData(req, res));
router.get('/:symbol/historical', (req, res) => stockController.getStockHistoricalData(req, res));

module.exports = router;