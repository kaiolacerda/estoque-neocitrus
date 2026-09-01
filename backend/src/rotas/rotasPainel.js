const express = require('express');
const painel = require('../controladores/controladorPainel');
const { exigirAutenticacao } = require('../intermediarios/middlewareAutenticacao');
const { manipuladorAssincrono } = require('../utilitarios/manipuladorAssincrono');

const roteador = express.Router();

roteador.get('/', exigirAutenticacao, manipuladorAssincrono(painel.visaoGeral));

module.exports = roteador;
