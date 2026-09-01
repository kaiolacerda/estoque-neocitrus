import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Tags, ShoppingCart, Users, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import logoNeocitrus from '../../assets/logo-neocitrus.png';

export default function LayoutAplicativo() {
  const { usuario, sair } = usarAutenticacao();
  const navegar = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const contaRef = useRef(null);

  const tratarSaida = () => {
    sair();
    navegar('/login');
  };

  const fecharMenu = () => setMenuAberto(false);

  const email = usuario?.email || '';
  const inicial = email.charAt(0).toUpperCase() || '?';
  const nomeExibido = email.split('@')[0] || 'Usuário';

  useEffect(() => {
    if (!contaAberta) return undefined;
    const aoClicarFora = (evento) => {
      if (contaRef.current && !contaRef.current.contains(evento.target)) {
        setContaAberta(false);
      }
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [contaAberta]);

  return (
    <div className="aplicativo">
      <header className={`menu-lateral${menuAberto ? ' menu-lateral--aberto' : ''}`}>
        <button
          type="button"
          className="menu-lateral__marca menu-lateral__marca--clicavel"
          onClick={() => { navegar('/'); fecharMenu(); }}
          aria-label="Ir para a página inicial"
        >
          <img src={logoNeocitrus} alt="Neocitrus" className="menu-lateral__marca-logo" />
        </button>

        <button
          type="button"
          className="menu-lateral__alternar"
          onClick={() => setMenuAberto((aberto) => !aberto)}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
        >
          {menuAberto ? <X /> : <Menu />}
        </button>

        <nav className="menu-lateral__navegacao">
          <LinkMenu para="/" rotulo="Estoque" Icone={LayoutDashboard} aoNavegar={fecharMenu} />
          <LinkMenu para="/produtos" rotulo="Produtos" Icone={Tags} aoNavegar={fecharMenu} />
          <LinkMenu para="/clientes" rotulo="Clientes" Icone={Users} aoNavegar={fecharMenu} />
          <LinkMenu para="/vendas" rotulo="Vendas" Icone={ShoppingCart} aoNavegar={fecharMenu} />
        </nav>

        <div className="menu-lateral__conta" ref={contaRef}>
          <button
            type="button"
            className="menu-lateral__conta-botao"
            onClick={() => setContaAberta((aberta) => !aberta)}
            aria-expanded={contaAberta}
          >
            <span className="menu-lateral__conta-avatar">{inicial}</span>
            <span className="menu-lateral__conta-nome">{nomeExibido}</span>
            <ChevronDown size={16} className="menu-lateral__conta-chevron" />
          </button>

          {contaAberta && (
            <div className="menu-lateral__conta-dropdown">
              <div className="menu-lateral__conta-email">{email}</div>
              <button type="button" onClick={tratarSaida}>
                <LogOut size={15} />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="conteudo-principal">
        <Outlet />
      </main>
    </div>
  );
}

function LinkMenu({ para, rotulo, Icone, aoNavegar }) {
  const navegar = useNavigate();
  const rotaAtual = useLocation();
  const ativo = rotaAtual.pathname === para;
  return (
    <button className={ativo ? 'ativo' : ''} onClick={() => { navegar(para); aoNavegar?.(); }}>
      <Icone />
      {rotulo}
    </button>
  );
}