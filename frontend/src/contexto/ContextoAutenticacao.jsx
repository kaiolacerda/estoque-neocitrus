import { createContext, useContext, useEffect, useState } from 'react';
import { servicoApi, armazenamentoToken } from '../servicos/servicoApi';

const ContextoAutenticacao = createContext(null);

export function ProvedorAutenticacao({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = armazenamentoToken.obter();
    if (!token) {
      setCarregando(false);
      return;
    }
    servicoApi
      .obterUsuarioAtual()
      .then(({ usuario }) => setUsuario(usuario))
      .catch(() => armazenamentoToken.limpar())
      .finally(() => setCarregando(false));
  }, []);

  const entrar = async (email, senha) => {
    const { token, usuario } = await servicoApi.entrar({ email, senha });
    armazenamentoToken.definir(token);
    setUsuario(usuario);
  };

  const sair = () => {
    armazenamentoToken.limpar();
    setUsuario(null);
  };

  return (
    <ContextoAutenticacao.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </ContextoAutenticacao.Provider>
  );
}

export function usarAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) throw new Error('usarAutenticacao precisa ser usado dentro de um ProvedorAutenticacao');
  return contexto;
}
