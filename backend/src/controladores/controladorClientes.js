const { nanoid } = require('nanoid');
const ModeloCliente = require('../modelos/modeloCliente');
const ModeloVenda = require('../modelos/modeloVenda');
const ModeloItemVenda = require('../modelos/modeloItemVenda');
const { agregarFinanceiro, arredondar } = require('../utilitarios/utilitarioVendas');

async function listar(req, res) {
  const clientes = await ModeloCliente.listarTodos();
  const vendas = await ModeloVenda.todas();
  const itens = await ModeloItemVenda.porVendas(vendas.map((v) => v.id));
  const itensPorVenda = {};
  itens.forEach((item) => {
    if (!itensPorVenda[item.vendaId]) itensPorVenda[item.vendaId] = [];
    itensPorVenda[item.vendaId].push(item);
  });

  const vendasPorCliente = {};
  vendas.forEach((venda) => {
    if (!venda.clienteId) return;
    if (!vendasPorCliente[venda.clienteId]) vendasPorCliente[venda.clienteId] = [];
    vendasPorCliente[venda.clienteId].push(venda);
  });

  // Cada cliente já vem com um resuminho (vendas feitas, total comprado, a
  // receber pendente) — usado pra deixar os cards da listagem mais úteis,
  // sem precisar abrir "Detalhes" pra ver o básico.
  const clientesComResumo = clientes.map((cliente) => ({
    ...cliente,
    resumo: arredondar(agregarFinanceiro(vendasPorCliente[cliente.id] || [], itensPorVenda))
  }));

  res.json(clientesComResumo);
}

async function buscarUm(req, res) {
  const cliente = await ModeloCliente.buscarPorId(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(cliente);
}

async function criar(req, res) {
  const { nome, telefone, email, endereco, observacoes } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório.' });
  }

  const novoCliente = {
    id: nanoid(8),
    nome: nome.trim(),
    telefone: (telefone || '').trim(),
    email: (email || '').trim(),
    endereco: (endereco || '').trim(),
    observacoes: (observacoes || '').trim(),
    criadoEm: new Date().toISOString()
  };

  const criado = await ModeloCliente.criar(novoCliente);
  res.status(201).json(criado);
}

async function atualizar(req, res) {
  const cliente = await ModeloCliente.buscarPorId(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const { nome, telefone, email, endereco, observacoes } = req.body;

  if (nome !== undefined && !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório.' });
  }

  const atualizado = await ModeloCliente.atualizar(req.params.id, {
    ...(nome !== undefined && { nome: nome.trim() }),
    ...(telefone !== undefined && { telefone: telefone.trim() }),
    ...(email !== undefined && { email: email.trim() }),
    ...(endereco !== undefined && { endereco: endereco.trim() }),
    ...(observacoes !== undefined && { observacoes: observacoes.trim() }),
    atualizadoEm: new Date().toISOString()
  });

  res.json(atualizado);
}

async function remover(req, res) {
  const cliente = await ModeloCliente.buscarPorId(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  await ModeloCliente.remover(req.params.id);
  res.json({ sucesso: true });
}

// Tela de "Detalhes": dados cadastrais + histórico de vendas desse cliente +
// quanto ele tem "a receber" pendente com a loja.
async function detalhes(req, res) {
  const cliente = await ModeloCliente.buscarPorId(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const vendas = (await ModeloVenda.todas())
    .filter((venda) => venda.clienteId === req.params.id)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));

  const itens = await ModeloItemVenda.porVendas(vendas.map((v) => v.id));
  const itensPorVenda = {};
  itens.forEach((item) => {
    if (!itensPorVenda[item.vendaId]) itensPorVenda[item.vendaId] = [];
    itensPorVenda[item.vendaId].push(item);
  });

  const resumo = arredondar(agregarFinanceiro(vendas, itensPorVenda));
  const vendasComItens = vendas.map((venda) => ({ ...venda, itens: itensPorVenda[venda.id] || [] }));

  res.json({ cliente, resumo, vendas: vendasComItens });
}

module.exports = { listar, buscarUm, criar, atualizar, remover, detalhes };