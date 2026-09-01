const express = require('express');
const autenticacao = require('../controladores/controladorAutenticacao');
const { exigirAutenticacao } = require('../intermediarios/middlewareAutenticacao');
const { manipuladorAssincrono } = require('../utilitarios/manipuladorAssincrono');

const roteador = express.Router();

roteador.post('/entrar', manipuladorAssincrono(autenticacao.entrar));
roteador.get('/eu', exigirAutenticacao, manipuladorAssincrono(autenticacao.eu));

module.exports = roteador;
