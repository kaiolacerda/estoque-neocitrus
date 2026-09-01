const express = require('express');
const clientes = require('../controladores/controladorClientes');
const { exigirAutenticacao } = require('../intermediarios/middlewareAutenticacao');
const { manipuladorAssincrono } = require('../utilitarios/manipuladorAssincrono');

const roteador = express.Router();

roteador.use(exigirAutenticacao);

roteador.get('/', manipuladorAssincrono(clientes.listar));
roteador.get('/:id', manipuladorAssincrono(clientes.buscarUm));
roteador.get('/:id/detalhes', manipuladorAssincrono(clientes.detalhes));
roteador.post('/', manipuladorAssincrono(clientes.criar));
roteador.put('/:id', manipuladorAssincrono(clientes.atualizar));
roteador.delete('/:id', manipuladorAssincrono(clientes.remover));

module.exports = roteador;
