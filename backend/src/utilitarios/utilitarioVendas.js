const ModeloVenda = require('../modelos/modeloVenda');

// converte pra YYYY-MM sempre no fuso de Brasília — dataIso costuma vir de
// nova Date().toISOString() (UTC), então perto da meia-noite local (ex: 21h
// no Brasil = já é 00h do dia seguinte em UTC) um slice() cru no texto UTC
// jogaria a venda pro mês errado. Aqui a conversão é sempre pro fuso local.
function chaveDoMes(dataIso) {
  const formatador = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit'
  });
  const partes = formatador.formatToParts(new Date(dataIso));
  const ano = partes.find((parte) => parte.type === 'year').value;
  const mes = partes.find((parte) => parte.type === 'month').value;
  return `${ano}-${mes}`;
}

// pagamento é por item (um pedido pode ter produto pago e outro ainda não),
// então o lucro do período só conta os itens já marcados como "pago"
function agregarFinanceiro(vendas, itensPorVenda) {
  return vendas.reduce(
    (acumulado, venda) => {
      if (venda.status === 'cancelada') return acumulado;
      const itens = itensPorVenda[venda.id] || [];
      if (itens.length === 0) return acumulado;

      const subtotalVenda = itens.reduce((soma, item) => soma + item.subtotal, 0);
      const despesas = venda.despesasAdicionais || 0;

      itens.forEach((item) => {
        const despesaRateada = subtotalVenda > 0 ? despesas * (item.subtotal / subtotalVenda) : 0;
        acumulado.receitaTotal += item.subtotal;
        acumulado.custoTotal += item.custoTotal;

        if (item.statusPagamento === 'pago') {
          acumulado.lucroTotal += item.lucro - despesaRateada;
        } else {
          acumulado.aReceberTotal += item.subtotal;
        }
      });

      acumulado.numeroVendas += 1;
      return acumulado;
    },
    { receitaTotal: 0, custoTotal: 0, lucroTotal: 0, aReceberTotal: 0, numeroVendas: 0 }
  );
}

function arredondar(objeto) {
  const campos = ['receitaTotal', 'custoTotal', 'lucroTotal', 'aReceberTotal'];
  const resultado = { ...objeto };
  campos.forEach((campo) => {
    if (resultado[campo] !== undefined) resultado[campo] = Number((resultado[campo] || 0).toFixed(2));
  });
  return resultado;
}

// remove da lista pedidos sem nenhum item (sobra de bug antigo ou de uma venda
// que ficou pela metade) e apaga o registro órfão do banco de uma vez
async function excluirOrfasEFiltrar(vendas, itensPorVenda) {
  const validas = [];
  for (const venda of vendas) {
    const itens = itensPorVenda[venda.id] || [];
    if (itens.length === 0) {
      await ModeloVenda.remover(venda.id);
      continue;
    }
    validas.push(venda);
  }
  return validas;
}

module.exports = { chaveDoMes, agregarFinanceiro, arredondar, excluirOrfasEFiltrar };
