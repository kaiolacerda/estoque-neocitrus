const express = require('express');
const vendas = require('../controladores/controladorVendas');
const { exigirAutenticacao } = require('../intermediarios/middlewareAutenticacao');
const { manipuladorAssincrono } = require('../utilitarios/manipuladorAssincrono');

const roteador = express.Router();

roteador.use(exigirAutenticacao);

roteador.post('/', manipuladorAssincrono(vendas.criarVenda));
roteador.get('/', manipuladorAssincrono(vendas.listar));
roteador.patch('/:id/itens/:itemId/pagar', manipuladorAssincrono(vendas.marcarItemPago));
roteador.delete('/:id/itens/:itemId', manipuladorAssincrono(vendas.removerItemVenda));
roteador.put('/:id/itens/:itemId', manipuladorAssincrono(vendas.editarItemVenda));
roteador.get('/resumo-mes', manipuladorAssincrono(vendas.resumoMes));
roteador.get('/historico', manipuladorAssincrono(vendas.historico));
roteador.get('/recentes', manipuladorAssincrono(vendas.recentes));

module.exports = roteador;
