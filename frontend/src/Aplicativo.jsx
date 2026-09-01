import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProvedorAutenticacao } from './contexto/ContextoAutenticacao';
import RotaProtegida from './componentes/RotaProtegida';
import LayoutAplicativo from './componentes/layout/LayoutAplicativo';

import PaginaLogin from './paginas/PaginaLogin';
import PaginaPainel from './paginas/PaginaPainel';
import PaginaProdutos from './paginas/PaginaProdutos';
import PaginaVendas from './paginas/PaginaVendas';
import PaginaClientes from './paginas/PaginaClientes';

export default function Aplicativo() {
  return (
    <BrowserRouter>
      <ProvedorAutenticacao>
        <Routes>
          <Route path="/login" element={<PaginaLogin />} />

          <Route
            element={
              <RotaProtegida>
                <LayoutAplicativo />
              </RotaProtegida>
            }
          >
            <Route path="/" element={<PaginaPainel />} />
            <Route path="/produtos" element={<PaginaProdutos />} />
            <Route path="/vendas" element={<PaginaVendas />} />
            <Route path="/clientes" element={<PaginaClientes />} />
          </Route>
        </Routes>
      </ProvedorAutenticacao>
    </BrowserRouter>
  );
}
