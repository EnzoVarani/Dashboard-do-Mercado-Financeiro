require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stockRoutes = require('./routes/stockRoutes');

const app = express();

const allowedOrigins = [
  'https://dashboard-do-mercado-financeiro.vercel.app',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Dashboard do Mercado Financeiro API funcionando!',
        version: '1.0.final',
        endpoints: {
            singleStock: '/api/stocks/{SYMBOL}',
            multipleStocks: '/api/stocks/multiple?symbols=SYMBOL1,SYMBOL2',
            stockHistorical: '/api/stocks/{SYMBOL}/historical',
        }
    });
});

app.use('/api/stocks', stockRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});