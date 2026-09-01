function tratadorErros(erro, req, res, proximo) {
  console.error(erro);
  res.status(erro.status || 500).json({
    erro: erro.message || 'Erro interno no servidor.'
  });
}

module.exports = { tratadorErros };
