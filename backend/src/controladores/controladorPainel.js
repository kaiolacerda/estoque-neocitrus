const ModeloProduto = require('../modelos/modeloProduto');
const ModeloVenda = require('../modelos/modeloVenda');
const ModeloItemVenda = require('../modelos/modeloItemVenda');
const { chaveDoMes, agregarFinanceiro, arredondar, excluirOrfasEFiltrar } = require('../utilitarios/utilitarioVendas');

const LIMITE_ESTOQUE_BAIXO = 10;

async function visaoGeral(req, res) {
  const produtos = await ModeloProduto.listarTodos();
  const vendasRecentesHeader = await ModeloVenda.recentes(3);
  const itensRecentes = await ModeloItemVenda.porVendas(vendasRecentesHeader.map((v) => v.id));
  const itensPorVenda = {};
  itensRecentes.forEach((item) => {
    if (!itensPorVenda[item.vendaId]) itensPorVenda[item.vendaId] = [];
    itensPorVenda[item.vendaId].push(item);
  });
  const vendasRecentes = (await excluirOrfasEFiltrar(vendasRecentesHeader, itensPorVenda))
    .map((venda) => ({ ...venda, itens: itensPorVenda[venda.id] || [] }));

  const totalProdutos = produtos.length;
  const totalLitros = produtos.reduce((soma, p) => soma + (p.tipo === 'litro' ? p.estoqueAtual : 0), 0);
  const totalUnidades = produtos.reduce((soma, p) => soma + (p.tipo === 'unidade' ? p.estoqueAtual : 0), 0);
  const valorTotalEstoque = produtos.reduce((soma, p) => soma + p.estoqueAtual * p.custoBase, 0);
  const saudeEstoque = [
    { situacao: 'saudavel', rotulo: 'Estoque saudável', produtos: [] },
    { situacao: 'baixo', rotulo: 'Estoque baixo', produtos: [] },
    { situacao: 'zerado', rotulo: 'Sem estoque', produtos: [] }
  ];

  produtos.forEach((produto) => {
    const item = { id: produto.id, nome: produto.nome, quantidade: produto.estoqueAtual };
    if (produto.estoqueAtual <= 0) saudeEstoque[2].produtos.push(item);
    else if (produto.estoqueAtual <= LIMITE_ESTOQUE_BAIXO) saudeEstoque[1].produtos.push(item);
    else saudeEstoque[0].produtos.push(item);
  });

  saudeEstoque.forEach((situacao) => {
    situacao.produtos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    situacao.quantidade = situacao.produtos.length;
  });

  const mesAtual = chaveDoMes(new Date().toISOString());
  const todasVendas = await ModeloVenda.todas();
  const vendasDoMes = todasVendas.filter((v) => chaveDoMes(v.criadoEm) === mesAtual);
  const itensDoMes = await ModeloItemVenda.porVendas(vendasDoMes.map((v) => v.id));
  const itensPorVendaMes = {};
  itensDoMes.forEach((item) => {
    if (!itensPorVendaMes[item.vendaId]) itensPorVendaMes[item.vendaId] = [];
    itensPorVendaMes[item.vendaId].push(item);
  });
  const { lucroTotal, aReceberTotal } = arredondar(agregarFinanceiro(vendasDoMes, itensPorVendaMes));

  const anoAtual = Number(mesAtual.slice(0, 4));
  const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const vendasDoAno = todasVendas.filter((v) => Number(chaveDoMes(v.criadoEm).slice(0, 4)) === anoAtual);
  const itensDoAno = await ModeloItemVenda.porVendas(vendasDoAno.map((v) => v.id));
  const itensPorVendaAno = {};
  itensDoAno.forEach((item) => {
    if (!itensPorVendaAno[item.vendaId]) itensPorVendaAno[item.vendaId] = [];
    itensPorVendaAno[item.vendaId].push(item);
  });

  const faturamentoAnual = NOMES_MESES.map((rotulo, indice) => {
    const chaveMes = `${anoAtual}-${String(indice + 1).padStart(2, '0')}`;
    const vendasMes = vendasDoAno.filter((v) => chaveDoMes(v.criadoEm) === chaveMes);
    const { lucroTotal: lucroMes } = arredondar(agregarFinanceiro(vendasMes, itensPorVendaAno));
    return { rotulo, valor: lucroMes };
  });
  const faturamentoAnualTotal = Number(faturamentoAnual.reduce((soma, m) => soma + m.valor, 0).toFixed(2));

  res.json({
    totalProdutos,
    totalLitros: Number(totalLitros.toFixed(2)),
    totalUnidades: Number(totalUnidades.toFixed(2)),
    valorTotalEstoque: Number(valorTotalEstoque.toFixed(2)),
    lucroDoMes: lucroTotal,
    aReceberMes: aReceberTotal,
    limiteEstoqueBaixo: LIMITE_ESTOQUE_BAIXO,
    faturamentoAnual,
    faturamentoAnualTotal,
    saudeEstoque,
    vendasRecentes
  });
}

module.exports = { visaoGeral };
