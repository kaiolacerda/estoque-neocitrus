const express = require('express');
const produtos = require('../controladores/controladorProdutos');
const { exigirAutenticacao } = require('../intermediarios/middlewareAutenticacao');
const { manipuladorAssincrono } = require('../utilitarios/manipuladorAssincrono');

const roteador = express.Router();

roteador.use(exigirAutenticacao);

roteador.get('/', manipuladorAssincrono(produtos.listar));
roteador.get('/:id', manipuladorAssincrono(produtos.buscarUm));
roteador.post('/', manipuladorAssincrono(produtos.criar));
roteador.put('/:id', manipuladorAssincrono(produtos.atualizar));
roteador.delete('/:id', manipuladorAssincrono(produtos.remover));

module.exports = roteador;
