import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usarAutenticacao } from '../contexto/ContextoAutenticacao';
import logoNeocitrus from '../assets/logo-neocitrus.png';

export default function PaginaLogin() {
  const { entrar } = usarAutenticacao();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const tratarEnvio = async (evento) => {
    evento.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await entrar(email, senha);
      navegar('/');
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="pagina-login">
      <div className="cartao-login">
        <img src={logoNeocitrus} alt="Neocitrus" className="cartao-login__logo" />
        <h1 className="cartao-login__titulo">Entrar</h1>
        <p className="cartao-login__subtitulo">Acesso restrito. Use o e-mail e a senha da empresa.</p>

        {erro && <div className="faixa-erro">{erro}</div>}

        <form onSubmit={tratarEnvio}>
          <div className="campo">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="empresa@exemplo.com"
              required
              autoFocus
            />
          </div>
          <div className="campo">
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="botao primario bloco" disabled={carregando}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}