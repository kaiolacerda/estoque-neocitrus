import { Navigate } from 'react-router-dom';
import { usarAutenticacao } from '../contexto/ContextoAutenticacao';

export default function RotaProtegida({ children }) {
  const { usuario, carregando } = usarAutenticacao();

  if (carregando) {
    return <div className="vazio" style={{ paddingTop: 80 }}>Carregando…</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
