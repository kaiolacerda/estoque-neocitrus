const BASE = import.meta.env.VITE_API_URL || '/api';

function obterToken() {
  return localStorage.getItem('estoque_token');
}

async function tratarResposta(resposta) {
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Erro na requisição');
  return dados;
}

function cabecalhosAutenticacao() {
  const token = obterToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const armazenamentoToken = {
  obter: obterToken,
  definir: (token) => localStorage.setItem('estoque_token', token),
  limpar: () => localStorage.removeItem('estoque_token')
};

export const servicoApi = {
  // ---- Autenticação ----
  entrar: (payload) =>
    fetch(`${BASE}/autenticacao/entrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(tratarResposta),

  obterUsuarioAtual: () =>
    fetch(`${BASE}/autenticacao/eu`, { headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta),

  // ---- Painel ----
  obterPainel: () => fetch(`${BASE}/painel`, { headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta),

  // ---- Produtos ----
  obterProdutos: () => fetch(`${BASE}/produtos`, { headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta),

  criarProduto: (payload) =>
    fetch(`${BASE}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cabecalhosAutenticacao() },
      body: JSON.stringify(payload)
    }).then(tratarResposta),

  atualizarProduto: (id, payload) =>
    fetch(`${BASE}/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cabecalhosAutenticacao() },
      body: JSON.stringify(payload)
    }).then(tratarResposta),

  removerProduto: (id) =>
    fetch(`${BASE}/produtos/${id}`, { method: 'DELETE', headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta),

  // ---- Clientes ----
  obterClientes: () => fetch(`${BASE}/clientes`, { headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta),

  obterClienteDetalhes: (id) =>
    fetch(`${BASE}/clientes/${id}/detalhes`, { headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta),

  criarCliente: (payload) =>
    fetch(`${BASE}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cabecalhosAutenticacao() },
      body: JSON.stringify(payload)
    }).then(tratarResposta),

  atualizarCliente: (id, payload) =>
    fetch(`${BASE}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cabecalhosAutenticacao() },
      body: JSON.stringify(payload)
    }).then(tratarResposta),

  removerCliente: (id) =>
    fetch(`${BASE}/clientes/${id}`, { method: 'DELETE', headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta),

  criarVenda: (payload) =>
    fetch(`${BASE}/vendas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cabecalhosAutenticacao() },
      body: JSON.stringify(payload)
    }).then(tratarResposta),

  marcarItemPago: (vendaId, itemId) =>
    fetch(`${BASE}/vendas/${vendaId}/itens/${itemId}/pagar`, {
      method: 'PATCH',
      headers: { ...cabecalhosAutenticacao() }
    }).then(tratarResposta),

  removerItemVenda: (vendaId, itemId) =>
    fetch(`${BASE}/vendas/${vendaId}/itens/${itemId}`, {
      method: 'DELETE',
      headers: { ...cabecalhosAutenticacao() }
    }).then(tratarResposta),

  editarItemVenda: (vendaId, itemId, payload) =>
    fetch(`${BASE}/vendas/${vendaId}/itens/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cabecalhosAutenticacao() },
      body: JSON.stringify(payload)
    }).then(tratarResposta),

  listarVendas: () => fetch(`${BASE}/vendas`, { headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta),

  // ---- Vendas ----
  obterResumoMes: (mes) =>
    fetch(`${BASE}/vendas/resumo-mes${mes ? `?mes=${mes}` : ''}`, { headers: { ...cabecalhosAutenticacao() } }).then(
      tratarResposta
    ),

  obterHistoricoVendas: () =>
    fetch(`${BASE}/vendas/historico`, { headers: { ...cabecalhosAutenticacao() } }).then(tratarResposta)
};
