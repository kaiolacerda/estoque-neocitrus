const { nanoid } = require('nanoid');
const ModeloProduto = require('../modelos/modeloProduto');
const ModeloVenda = require('../modelos/modeloVenda');
const ModeloItemVenda = require('../modelos/modeloItemVenda');
const ModeloCliente = require('../modelos/modeloCliente');
const { chaveDoMes, agregarFinanceiro, arredondar, excluirOrfasEFiltrar } = require('../utilitarios/utilitarioVendas');

function arred2(numero) {
  return Number((numero || 0).toFixed(2));
}

function agruparItensPorVenda(itens) {
  const mapa = {};
  itens.forEach((item) => {
    if (!mapa[item.vendaId]) mapa[item.vendaId] = [];
    mapa[item.vendaId].push(item);
  });
  return mapa;
}

async function anexarItens(vendas) {
  if (vendas.length === 0) return [];
  const itens = await ModeloItemVenda.porVendas(vendas.map((v) => v.id));
  const itensPorVenda = agruparItensPorVenda(itens);
  const vendasValidas = await excluirOrfasEFiltrar(vendas, itensPorVenda);
  return vendasValidas.map((venda) => ({ ...venda, itens: itensPorVenda[venda.id] || [] }));
}

async function criarVenda(req, res) {
  const { data, clienteId, itens, despesasAdicionais, numeroNota } = req.body;

  if (!clienteId) {
    return res.status(400).json({ erro: 'Selecione o cliente.' });
  }

  const cliente = await ModeloCliente.buscarPorId(clienteId);
  if (!cliente) {
    return res.status(404).json({ erro: 'Cliente não encontrado. Cadastre-o na tela de Clientes.' });
  }

  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Adicione pelo menos um produto ao carrinho.' });
  }

  const itensCalculados = [];
  const baixasEstoque = [];
  const quantidadeTotalPorProduto = {};

  for (const itemBruto of itens) {
    const { produtoId, quantidade, margemPercentual, precoUnitario: precoUnitarioManual } = itemBruto;

    const produto = await ModeloProduto.buscarPorId(produtoId);
    if (!produto) {
      return res.status(404).json({ erro: `Produto não encontrado (id ${produtoId}).` });
    }

    const qtd = Number(quantidade);
    if (!qtd || qtd <= 0) {
      return res.status(400).json({ erro: `Quantidade inválida para "${produto.nome}".` });
    }
    if (!Number.isInteger(qtd)) {
      return res.status(400).json({ erro: `A quantidade vendida de "${produto.nome}" precisa ser um número inteiro (sem casas decimais).` });
    }

    quantidadeTotalPorProduto[produtoId] = (quantidadeTotalPorProduto[produtoId] || 0) + qtd;
    if (quantidadeTotalPorProduto[produtoId] > produto.estoqueAtual) {
      const rotuloUnidade = produto.tipo === 'litro' ? 'L' : 'un.';
      return res.status(400).json({
        erro: `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoqueAtual} ${rotuloUnidade}.`
      });
    }

    const custoUnitarioMomento = produto.custoBase;

    // preço manual > margem manual > margem padrão do cadastro
    let margemAplicada;
    let precoUnitario;
    if (precoUnitarioManual !== undefined && precoUnitarioManual !== null && precoUnitarioManual !== '') {
      precoUnitario = Number(precoUnitarioManual);
      margemAplicada = custoUnitarioMomento > 0
        ? Number((((precoUnitario - custoUnitarioMomento) / custoUnitarioMomento) * 100).toFixed(2))
        : 0;
    } else {
      margemAplicada = margemPercentual !== undefined && margemPercentual !== null && margemPercentual !== ''
        ? Number(margemPercentual)
        : produto.margemPadrao;
      precoUnitario = Number((custoUnitarioMomento * (1 + margemAplicada / 100)).toFixed(2));
    }

    if (Number.isNaN(precoUnitario) || precoUnitario < 0) {
      return res.status(400).json({ erro: `Preço inválido para "${produto.nome}".` });
    }

    const subtotal = arred2(qtd * precoUnitario);
    const custoTotalItem = arred2(qtd * custoUnitarioMomento);
    const lucroItem = arred2(subtotal - custoTotalItem);

    itensCalculados.push({
      id: nanoid(8),
      produtoId: produto.id,
      produtoNome: produto.nome,
      produtoSku: produto.sku,
      tipo: produto.tipo,
      quantidade: qtd,
      custoUnitarioMomento,
      margemAplicada,
      precoUnitario,
      subtotal,
      custoTotal: custoTotalItem,
      lucro: lucroItem,
      statusPagamento: 'a_receber'
    });

    baixasEstoque.push({ produtoId: produto.id, produto, quantidade: qtd });
  }

  const subtotalVenda = arred2(itensCalculados.reduce((soma, item) => soma + item.subtotal, 0));
  const custoTotalVenda = arred2(itensCalculados.reduce((soma, item) => soma + item.custoTotal, 0));

  const totalPagar = subtotalVenda;
  const despesas = Number(despesasAdicionais) || 0;
  if (despesas < 0) {
    return res.status(400).json({ erro: 'Despesas adicionais não podem ser negativas.' });
  }
  const lucroVenda = arred2(subtotalVenda - custoTotalVenda - despesas);

  // baixa atômica no banco — se alguém finalizar outra venda ao mesmo tempo e
  // furar o estoque, a operação abaixo falha e desfazemos o que já tinha sido baixado
  const baixasFeitas = [];
  for (const baixa of baixasEstoque) {
    const atualizado = await ModeloProduto.baixarEstoqueSeSuficiente(baixa.produtoId, baixa.quantidade);
    if (!atualizado) {
      for (const feita of baixasFeitas) {
        await ModeloProduto.ajustarEstoque(feita.produtoId, feita.quantidade);
      }
      return res.status(409).json({ erro: `Estoque de "${baixa.produto.nome}" mudou enquanto a venda era finalizada. Confira o carrinho e tente de novo.` });
    }
    baixasFeitas.push(baixa);
  }

  const numeroSequencial = await ModeloVenda.contarTodas();
  const numero = `#${10001 + numeroSequencial}`;

  const venda = await ModeloVenda.criar({
    id: nanoid(8),
    numero,
    numeroNota: (numeroNota || '').toString().trim(),
    data: data || new Date().toISOString().slice(0, 10),
    clienteId: cliente.id,
    cliente: cliente.nome,
    subtotal: subtotalVenda,
    despesasAdicionais: despesas,
    totalPagar,
    custoTotal: custoTotalVenda,
    lucro: lucroVenda,
    criadoEm: new Date().toISOString()
  });

  const itensSalvos = await ModeloItemVenda.criarVarios(
    itensCalculados.map((item) => ({ ...item, vendaId: venda.id }))
  );

  res.status(201).json({ venda: { ...venda, itens: itensSalvos } });
}

async function recalcularTotaisVenda(vendaId) {
  const venda = await ModeloVenda.buscarPorId(vendaId);
  if (!venda) return null;

  const itens = await ModeloItemVenda.porVenda(vendaId);

  const subtotal = arred2(itens.reduce((soma, item) => soma + item.subtotal, 0));
  const custoTotal = arred2(itens.reduce((soma, item) => soma + item.custoTotal, 0));
  const lucroItens = arred2(itens.reduce((soma, item) => soma + item.lucro, 0));
  const lucro = arred2(lucroItens - (venda.despesasAdicionais || 0));

  return ModeloVenda.atualizar(vendaId, {
    subtotal,
    custoTotal,
    totalPagar: subtotal,
    lucro,
    status: itens.length === 0 ? 'cancelada' : 'concluida'
  });
}

async function marcarItemPago(req, res) {
  const { id: vendaId, itemId } = req.params;

  const venda = await ModeloVenda.buscarPorId(vendaId);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

  const item = await ModeloItemVenda.buscarPorId(itemId);
  if (!item || item.vendaId !== vendaId) return res.status(404).json({ erro: 'Item não encontrado' });
  if (item.statusPagamento === 'pago') return res.status(400).json({ erro: 'Este item já está marcado como pago.' });

  await ModeloItemVenda.atualizar(itemId, { statusPagamento: 'pago' });
  const itens = await ModeloItemVenda.porVenda(vendaId);

  res.json({ venda: { ...venda, itens } });
}

async function removerItemVenda(req, res) {
  const { id: vendaId, itemId } = req.params;

  const venda = await ModeloVenda.buscarPorId(vendaId);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

  const item = await ModeloItemVenda.buscarPorId(itemId);
  if (!item || item.vendaId !== vendaId) return res.status(404).json({ erro: 'Item não encontrado' });

  await ModeloProduto.ajustarEstoque(item.produtoId, item.quantidade);
  await ModeloItemVenda.removerPorId(itemId);

  // Se esse era o último produto do pedido, o pedido inteiro deixa de existir.
  const itensRestantes = await ModeloItemVenda.porVenda(vendaId);
  if (itensRestantes.length === 0) {
    await ModeloVenda.remover(vendaId);
    return res.json({ sucesso: true, vendaRemovida: true });
  }

  const vendaAtualizada = await recalcularTotaisVenda(vendaId);
  res.json({ venda: { ...vendaAtualizada, itens: itensRestantes }, vendaRemovida: false });
}

async function editarItemVenda(req, res) {
  const { id: vendaId, itemId } = req.params;
  const { clienteId, data, numeroNota, precoUnitario: precoUnitarioManual, margemPercentual } = req.body;

  const venda = await ModeloVenda.buscarPorId(vendaId);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

  const item = await ModeloItemVenda.buscarPorId(itemId);
  if (!item || item.vendaId !== vendaId) return res.status(404).json({ erro: 'Item não encontrado' });

  // ---- Cliente, data e nº da nota pertencem à venda (pedido), não ao item ----
  const alteracoesVenda = {};
  if (clienteId !== undefined && clienteId !== null && clienteId !== '') {
    const cliente = await ModeloCliente.buscarPorId(clienteId);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado. Cadastre-o na tela de Clientes.' });
    }
    alteracoesVenda.clienteId = cliente.id;
    alteracoesVenda.cliente = cliente.nome;
  }
  if (data) {
    alteracoesVenda.data = data;
  }
  if (numeroNota !== undefined) {
    alteracoesVenda.numeroNota = numeroNota.toString().trim();
  }
  if (Object.keys(alteracoesVenda).length > 0) {
    await ModeloVenda.atualizar(vendaId, alteracoesVenda);
  }

  // ---- Preço/margem pertencem ao item — custo histórico do item nunca muda ----
  const custoUnitarioMomento = item.custoUnitarioMomento;
  let precoUnitario;
  let margemAplicada;

  if (precoUnitarioManual !== undefined && precoUnitarioManual !== null && precoUnitarioManual !== '') {
    precoUnitario = Number(precoUnitarioManual);
    if (Number.isNaN(precoUnitario) || precoUnitario < 0) {
      return res.status(400).json({ erro: 'Preço unitário inválido.' });
    }
    margemAplicada = custoUnitarioMomento > 0
      ? Number((((precoUnitario - custoUnitarioMomento) / custoUnitarioMomento) * 100).toFixed(2))
      : 0;
  } else if (margemPercentual !== undefined && margemPercentual !== null && margemPercentual !== '') {
    margemAplicada = Number(margemPercentual);
    if (Number.isNaN(margemAplicada)) {
      return res.status(400).json({ erro: 'Margem inválida.' });
    }
    precoUnitario = Number((custoUnitarioMomento * (1 + margemAplicada / 100)).toFixed(2));
  }

  if (precoUnitario !== undefined) {
    const subtotal = arred2(item.quantidade * precoUnitario);
    const custoTotal = arred2(item.quantidade * custoUnitarioMomento);
    const lucro = arred2(subtotal - custoTotal);
    await ModeloItemVenda.atualizar(itemId, {
      precoUnitario,
      margemAplicada,
      subtotal,
      custoTotal,
      lucro
    });
  }

  const vendaAtualizada = await recalcularTotaisVenda(vendaId);
  const itens = await ModeloItemVenda.porVenda(vendaId);
  res.json({ venda: { ...vendaAtualizada, itens } });
}

async function resumoMes(req, res) {
  const mes = req.query.mes || chaveDoMes(new Date().toISOString());
  const vendas = (await ModeloVenda.todas()).filter((v) => chaveDoMes(v.criadoEm) === mes);
  const itens = await ModeloItemVenda.porVendas(vendas.map((v) => v.id));
  const itensPorVenda = agruparItensPorVenda(itens);
  res.json({ mes, ...arredondar(agregarFinanceiro(vendas, itensPorVenda)) });
}

async function historico(req, res) {
  const vendas = await ModeloVenda.todas();
  const itens = await ModeloItemVenda.porVendas(vendas.map((v) => v.id));
  const itensPorVenda = agruparItensPorVenda(itens);

  const porMes = {};
  vendas.forEach((venda) => {
    const mes = chaveDoMes(venda.criadoEm);
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(venda);
  });

  const meses = Object.keys(porMes)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((mes) => ({ mes, ...arredondar(agregarFinanceiro(porMes[mes], itensPorVenda)) }));

  res.json(meses);
}

async function recentes(req, res) {
  const vendas = await ModeloVenda.recentes(10);
  res.json(await anexarItens(vendas));
}

async function listar(req, res) {
  const vendas = await ModeloVenda.listarOrdenadas();
  res.json(await anexarItens(vendas));
}

module.exports = { criarVenda, marcarItemPago, removerItemVenda, editarItemVenda, resumoMes, historico, recentes, listar };
