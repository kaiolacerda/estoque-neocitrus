import { useEffect, useState } from 'react';
import { Users, Phone } from 'lucide-react';
import { servicoApi } from '../../servicos/servicoApi';
import FormularioCliente from './FormularioCliente';
import DetalhesCliente from './DetalhesCliente';

const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function iniciaisDoNome(nome) {
  const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// cor fixa por cliente, calculada a partir do nome
const PALETA_AVATAR = ['#1f6b3a', '#2f9e56', '#c9862a', '#5b7fb5', '#8a5cb0', '#c0392b'];
function corDoAvatar(nome) {
  let soma = 0;
  for (const caractere of nome || '') soma += caractere.charCodeAt(0);
  return PALETA_AVATAR[soma % PALETA_AVATAR.length];
}

export default function ListaClientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [emEdicao, setEmEdicao] = useState(null); // null | 'novo' | cliente
  const [clienteDetalhesId, setClienteDetalhesId] = useState(null);

  const carregar = () => {
    setCarregando(true);
    servicoApi
      .obterClientes()
      .then(setClientes)
      .catch((erroCapturado) => setErro(erroCapturado.message))
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const tratarSalvar = async (formulario) => {
    if (emEdicao === 'novo') {
      await servicoApi.criarCliente(formulario);
    } else {
      await servicoApi.atualizarCliente(emEdicao.id, formulario);
    }
    setEmEdicao(null);
    carregar();
  };

  const tratarRemocao = async (cliente) => {
    if (!confirm(`Remover "${cliente.nome}" do cadastro de clientes? Vendas já feitas pra ele continuam no histórico.`)) return;
    await servicoApi.removerCliente(cliente.id);
    carregar();
  };

  return (
    <>
      <div className="clientes__cabecalho">
        <div>
          <h1 className="titulo-pagina">Clientes</h1>
          <p className="subtitulo-pagina">Cadastro de clientes usado na hora de fazer uma venda</p>
        </div>
        <div className="clientes__acoes">
          <button className="botao primario" onClick={() => setEmEdicao('novo')}>+ Novo cliente</button>
        </div>
      </div>

      {erro && <div className="faixa-erro">{erro}</div>}

      {!carregando && (
        <div className="linha-indicadores clientes__indicadores">
          <div className="cartao-indicador">
            <div className="cartao-indicador__texto">
              <div className="cartao-indicador__rotulo">Clientes cadastrados</div>
              <div className="cartao-indicador__valor">{clientes.length}</div>
            </div>
            <div className="cartao-indicador__icone"><Users /></div>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="vazio">Carregando clientes…</div>
      ) : clientes.length === 0 ? (
        <div className="vazio">Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.</div>
      ) : (
        <div className="grade-clientes">
          {clientes.map((cliente) => (
            <div className="cartao-cliente" key={cliente.id}>
              <div className="cartao-cliente__cabecalho">
                <div className="cartao-cliente__avatar" style={{ background: corDoAvatar(cliente.nome) }}>
                  {iniciaisDoNome(cliente.nome)}
                </div>
                <div className="cartao-cliente__identificacao">
                  <strong>{cliente.nome}</strong>
                  <span className="cartao-cliente__telefone">
                    <Phone size={12} /> {cliente.telefone}
                  </span>
                </div>
              </div>

              <div className="cartao-cliente__resumo">
                <span>{cliente.resumo?.numeroVendas || 0} venda{cliente.resumo?.numeroVendas === 1 ? '' : 's'}</span>
                <span>·</span>
                <span>{formatarMoeda(cliente.resumo?.receitaTotal)} em compras</span>
              </div>

              {cliente.resumo?.aReceberTotal > 0 && (
                <span className="cartao-cliente__pendencia">{formatarMoeda(cliente.resumo.aReceberTotal)} a receber</span>
              )}

              <div className="cartao-cliente__acoes">
                <button className="botao pequeno" onClick={() => setClienteDetalhesId(cliente.id)}>Detalhes</button>
                <button className="botao pequeno" onClick={() => setEmEdicao(cliente)}>Editar</button>
                <button className="botao pequeno perigo" onClick={() => tratarRemocao(cliente)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {emEdicao && (
        <FormularioCliente
          cliente={emEdicao === 'novo' ? null : emEdicao}
          aoFechar={() => setEmEdicao(null)}
          aoSalvar={tratarSalvar}
        />
      )}

      {clienteDetalhesId && (
        <DetalhesCliente clienteId={clienteDetalhesId} aoFechar={() => setClienteDetalhesId(null)} />
      )}
    </>
  );
}
