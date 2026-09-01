const { assinarToken } = require('../utilitarios/token');

async function entrar(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  const emailValido = (process.env.EMAIL_ACESSO || '').toLowerCase();
  const senhaValida = process.env.SENHA_ACESSO || '';

  if (email.toLowerCase() !== emailValido || senha !== senhaValida) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const token = assinarToken({ email: emailValido });
  res.json({ token, usuario: { email: emailValido } });
}

async function eu(req, res) {
  res.json({ usuario: { email: req.usuario.email } });
}

module.exports = { entrar, eu };
