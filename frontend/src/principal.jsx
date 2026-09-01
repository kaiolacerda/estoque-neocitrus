import React from 'react';
import ReactDOM from 'react-dom/client';
import Aplicativo from './Aplicativo.jsx';
import './estilos/comum.css';
import './estilos/layout.css';
import './estilos/autenticacao.css';
import './estilos/produtos.css';
import './estilos/painel.css';
import './estilos/vendas.css';
import './estilos/clientes.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Aplicativo />
  </React.StrictMode>
);
