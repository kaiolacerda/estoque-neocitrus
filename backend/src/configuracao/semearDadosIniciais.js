const ModeloProduto = require('../modelos/modeloProduto');

async function semearDadosIniciais() {
  const produtosExistentes = await ModeloProduto.listarTodos();
  if (produtosExistentes.length > 0) return;

  const agora = new Date().toISOString();

  await ModeloProduto.criar({
    id: 'p001',
    nome: 'Oranza',
    sku: 'ORZ-001',
    tipo: 'litro',
    estoqueAtual: 250,
    custoBase: 4.18,
    margemPadrao: 25,
    atualizadoEm: agora
  });

  await ModeloProduto.criar({
    id: 'p002',
    nome: 'Fungicida X Pro',
    sku: 'FGX-001',
    tipo: 'unidade',
    estoqueAtual: 50,
    custoBase: 120,
    margemPadrao: 20,
    atualizadoEm: agora
  });

  console.log('📦 Produtos de exemplo criados (banco estava vazio).');
}

module.exports = { semearDadosIniciais };
