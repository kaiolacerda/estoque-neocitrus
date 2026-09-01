const jwt = require('jsonwebtoken');

const CHAVE_SECRETA = process.env.CHAVE_JWT || 'chave-de-desenvolvimento-nao-use-em-producao';

function assinarToken(dados) {
  return jwt.sign({ email: dados.email }, CHAVE_SECRETA, { expiresIn: '7d' });
}

function verificarToken(token) {
  return jwt.verify(token, CHAVE_SECRETA);
}

module.exports = { assinarToken, verificarToken };
