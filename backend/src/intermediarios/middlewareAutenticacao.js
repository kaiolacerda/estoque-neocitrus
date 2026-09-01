const { verificarToken } = require('../utilitarios/token');

function exigirAutenticacao(req, res, proximo) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }

  try {
    const dados = verificarToken(token);
    req.usuario = { email: dados.email };
    proximo();
  } catch (erro) {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
}

module.exports = { exigirAutenticacao };
