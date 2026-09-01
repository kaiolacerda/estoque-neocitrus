const { nanoid } = require('nanoid');
const ModeloProduto = require('../modelos/modeloProduto');

const TIPOS_VALIDOS = ['litro', 'unidade'];

function validarCamposComuns({ tipo, estoqueAtual, margemPadrao }) {
  if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
    return 'Tipo inválido. Use "litro" ou "unidade".';
  }
  if (margemPadrao !== undefined) {
    const margem = Number(margemPadrao);
    if (Number.isNaN(margem) || margem < 0) {
      return 'A margem de lucro deve ser um número maior ou igual a 0.';
    }
  }
  if (estoqueAtual !== undefined && tipo === 'unidade' && !Number.isInteger(Number(estoqueAtual))) {
    return 'Produtos vendidos por unidade só aceitam estoque em números inteiros.';
  }
  return null;
}

async function listar(req, res) {
  res.json(await ModeloProduto.listarTodos());
}

async function buscarUm(req, res) {
  const produto = await ModeloProduto.buscarPorId(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(produto);
}

async function criar(req, res) {
  const { nome, sku, tipo, estoqueAtual, custoBase, margemPadrao } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }
  if (!sku || !sku.trim()) {
    return res.status(400).json({ erro: 'SKU é obrigatório.' });
  }

  const tipoFinal = tipo || 'litro';
  const erroValidacao = validarCamposComuns({ tipo: tipoFinal, estoqueAtual, margemPadrao });
  if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

  const skuNormalizado = sku.trim().toUpperCase();

  const novoProduto = {
    id: nanoid(8),
    nome,
    sku: skuNormalizado,
    tipo: tipoFinal,
    estoqueAtual: Number(estoqueAtual) || 0,
    custoBase: Number(custoBase) || 0,
    margemPadrao: Number(margemPadrao) || 0,
    atualizadoEm: new Date().toISOString()
  };

  try {
    const criado = await ModeloProduto.criar(novoProduto);
    res.status(201).json(criado);
  } catch (erro) {
    if (erro.code === 11000 && erro.keyPattern && erro.keyPattern.sku) {
      return res.status(400).json({ erro: `Já existe um produto cadastrado com o SKU "${skuNormalizado}".` });
    }
    throw erro;
  }
}

async function atualizar(req, res) {
  const produto = await ModeloProduto.buscarPorId(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  const { nome, sku, tipo, estoqueAtual, custoBase, margemPadrao } = req.body;

  if (sku !== undefined && !sku.trim()) {
    return res.status(400).json({ erro: 'SKU é obrigatório.' });
  }

  const tipoFinal = tipo !== undefined ? tipo : produto.tipo;
  const erroValidacao = validarCamposComuns({ tipo: tipoFinal, estoqueAtual, margemPadrao });
  if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

  const skuNormalizado = sku !== undefined ? sku.trim().toUpperCase() : undefined;

  try {
    const atualizado = await ModeloProduto.atualizar(req.params.id, {
      ...(nome && { nome }),
      ...(skuNormalizado !== undefined && { sku: skuNormalizado }),
      ...(tipo !== undefined && { tipo }),
      ...(estoqueAtual !== undefined && { estoqueAtual: Number(estoqueAtual) }),
      ...(custoBase !== undefined && { custoBase: Number(custoBase) }),
      ...(margemPadrao !== undefined && { margemPadrao: Number(margemPadrao) }),
      atualizadoEm: new Date().toISOString()
    });

    res.json(atualizado);
  } catch (erro) {
    if (erro.code === 11000 && erro.keyPattern && erro.keyPattern.sku) {
      return res.status(400).json({ erro: `Já existe um produto cadastrado com o SKU "${skuNormalizado}".` });
    }
    throw erro;
  }
}

async function remover(req, res) {
  const produto = await ModeloProduto.buscarPorId(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  await ModeloProduto.remover(req.params.id);
  res.json({ sucesso: true });
}

module.exports = { listar, buscarUm, criar, atualizar, remover };
