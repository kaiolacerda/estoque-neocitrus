const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const rotasAutenticacao = require('./rotas/rotasAutenticacao');
const rotasProdutos = require('./rotas/rotasProdutos');
const rotasPainel = require('./rotas/rotasPainel');
const rotasVendas = require('./rotas/rotasVendas');
const rotasClientes = require('./rotas/rotasClientes');
const { tratadorErros } = require('./intermediarios/tratadorErros');

const aplicativo = express();

aplicativo.use(cors());
aplicativo.use(express.json());
aplicativo.use(morgan('dev'));

aplicativo.get('/api/saude', (req, res) => res.json({ status: 'ok' }));

aplicativo.use('/api/autenticacao', rotasAutenticacao);
aplicativo.use('/api/produtos', rotasProdutos);
aplicativo.use('/api/painel', rotasPainel);
aplicativo.use('/api/vendas', rotasVendas);
aplicativo.use('/api/clientes', rotasClientes);

aplicativo.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
aplicativo.use(tratadorErros);

module.exports = aplicativo;
