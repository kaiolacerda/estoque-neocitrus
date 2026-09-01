import { useEffect, useState } from 'react';
import { CalendarDays, ShoppingCart, ClipboardList, Plus, Minus, Pencil, Trash2 } from 'lucide-react';
import { servicoApi } from '../../servicos/servicoApi';
import EditarItemVenda from './EditarItemVenda';

const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// new Date().toISOString() converte pra UTC — perto da meia-noite (ex: 21h58 no
// Brasil = 00h58 UTC) isso já "vira o dia" antes da hora, fazendo o filtro de mês
// abrir no mês seguinte sozinho. Aqui usamos os componentes locais da data mesmo.
function dataLocalIso(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function rotuloTipo(tipo) {
  return tipo === 'litro' ? 'Litro' : 'Unidade';
}

function rotuloUnidade(tipo) {
  return tipo === 'litro' ? 'L' : 'un.';
}

function rotuloUnidadePlural(tipo) {
  return tipo === 'litro' ? 'Litros' : 'Unidades';
}

// cada produto vira uma linha própria na tabela (cancelar/pagar age só naquele item)
function construirLinhasTabelaVendas(vendas) {
  const linhas = [];
  vendas.forEach((venda) => {
    const itens = venda.itens && venda.itens.length > 0 ? venda.itens : [];
    itens.forEach((item) => {
      linhas.push({
        chave: `${venda.id}-${item.id}`,
        venda,
        item
      });
    });
  });
  return linhas;
}

let contadorLinhaLocal = 0;
function novoIdLinha() {
  contadorLinhaLocal += 1;
  return `linha-${Date.now()}-${contadorLinhaLocal}`;
}

// prévia local — quem calcula e grava de verdade é o backend
function calcularItemCarrinho(produto, quantidade, margemPercentual, precoManual) {
  const qtd = Number(quantidade) || 0;
  const custoUnitario = produto.custoBase;
  let margemAplicada;
  let precoUnitario;

  if (precoManual !== '' && precoManual !== null && precoManual !== undefined) {
    precoUnitario = Number(precoManual) || 0;
    margemAplicada = custoUnitario > 0 ? Number((((precoUnitario - custoUnitario) / custoUnitario) * 100).toFixed(2)) : 0;
  } else {
    margemAplicada = margemPercentual !== '' && margemPercentual !== null && margemPercentual !== undefined
      ? Number(margemPercentual)
      : produto.margemPadrao;
    precoUnitario = Number((custoUnitario * (1 + margemAplicada / 100)).toFixed(2));
  }

  const subtotal = Number((qtd * precoUnitario).toFixed(2));
  return { precoUnitario, margemAplicada, subtotal };
}

export default function Vendas() {
  const [resumoMes, setResumoMes] = useState(null);
  const [todasVendas, setTodasVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // ---- Dados do pedido em construção (carrinho) ----
  const [data, setData] = useState(() => dataLocalIso());
  const [clienteId, setClienteId] = useState('');
  const [numeroNota, setNumeroNota] = useState('');
  const [carrinho, setCarrinho] = useState([]); // { linhaId, produtoId, quantidade, margemPercentual, precoManual }
  const [produtoParaAdicionar, setProdutoParaAdicionar] = useState('');
  const [quantidadeParaAdicionar, setQuantidadeParaAdicionar] = useState('');
  const [linhaEmEdicao, setLinhaEmEdicao] = useState(null);
  const [despesasAdicionais, setDespesasAdicionais] = useState('');
  const [erroCarrinho, setErroCarrinho] = useState('');
  const [finalizando, setFinalizando] = useState(false);

  // ---- Filtro por mês e busca por número da nota na tabela de vendas ----
  const [mesFiltro, setMesFiltro] = useState(() => dataLocalIso().slice(0, 7));
  const [buscaNota, setBuscaNota] = useState('');

  // ---- Edição de um item já registrado no histórico de vendas ----
  const [itemEmEdicao, setItemEmEdicao] = useState(null); // { venda, item }

  const carregarTudo = () => {
    return Promise.all([
      servicoApi.obterResumoMes(),
      servicoApi.listarVendas(),
      servicoApi.obterProdutos(),
      servicoApi.obterClientes()
    ]).then(([resumo, vendas, listaProdutos, listaClientes]) => {
      setResumoMes(resumo);
      setTodasVendas(vendas);
      setProdutos(listaProdutos);
      setClientes(listaClientes);
    });
  };

  useEffect(() => {
    carregarTudo()
      .catch((erroCapturado) => setErro(erroCapturado.message))
      .finally(() => setCarregando(false));
  }, []);

  const cancelarItem = async (venda, item) => {
    if (!window.confirm(`Cancelar "${item.produtoNome}" da venda de ${venda.cliente}? O estoque será devolvido e o item será apagado — essa ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await servicoApi.removerItemVenda(venda.id, item.id);
      await carregarTudo();
    } catch (erroCapturado) {
      window.alert(erroCapturado.message);
    }
  };

  const pagarItem = async (venda, item) => {
    if (item.statusPagamento === 'pago') return;
    if (!window.confirm(`Você gostaria de registrar essa venda como paga? ("${item.produtoNome}" — ${venda.cliente})`)) {
      return;
    }
    try {
      await servicoApi.marcarItemPago(venda.id, item.id);
      await carregarTudo();
    } catch (erroCapturado) {
      window.alert(erroCapturado.message);
    }
  };

  const salvarEdicaoItem = async (payload) => {
    if (!itemEmEdicao) return;
    await servicoApi.editarItemVenda(itemEmEdicao.venda.id, itemEmEdicao.item.id, payload);
    setItemEmEdicao(null);
    await carregarTudo();
  };

  // ---- Carrinho ----
  const buscarProduto = (produtoId) => produtos.find((p) => p.id === produtoId);

  const estoqueDisponivelParaLinha = (linhaId, produtoId) => {
    const produto = buscarProduto(produtoId);
    if (!produto) return 0;
    const usadoEmOutrasLinhas = carrinho
      .filter((linha) => linha.produtoId === produtoId && linha.linhaId !== linhaId)
      .reduce((soma, linha) => soma + (Number(linha.quantidade) || 0), 0);
    return Number((produto.estoqueAtual - usadoEmOutrasLinhas).toFixed(3));
  };

  const adicionarAoCarrinho = () => {
    setErroCarrinho('');
    if (!produtoParaAdicionar) {
      setErroCarrinho('Selecione um produto.');
      return;
    }
    const qtd = Number(quantidadeParaAdicionar);
    if (!qtd || qtd <= 0) {
      setErroCarrinho('Informe uma quantidade válida.');
      return;
    }
    if (!Number.isInteger(qtd)) {
      setErroCarrinho('A quantidade tem que ser um número inteiro, sem casas decimais.');
      return;
    }

    setCarrinho((atual) => {
      const linhaExistente = atual.find((linha) => linha.produtoId === produtoParaAdicionar);
      if (linhaExistente) {
        return atual.map((linha) =>
          linha.linhaId === linhaExistente.linhaId
            ? { ...linha, quantidade: Number(linha.quantidade || 0) + qtd }
            : linha
        );
      }
      return [...atual, { linhaId: novoIdLinha(), produtoId: produtoParaAdicionar, quantidade: qtd, margemPercentual: '', precoManual: '' }];
    });
    setProdutoParaAdicionar('');
    setQuantidadeParaAdicionar('');
  };

  const atualizarLinha = (linhaId, alteracoes) => {
    setCarrinho((atual) => atual.map((linha) => (linha.linhaId === linhaId ? { ...linha, ...alteracoes } : linha)));
  };

  const removerLinha = (linhaId) => {
    setCarrinho((atual) => atual.filter((linha) => linha.linhaId !== linhaId));
    setLinhaEmEdicao((atual) => (atual === linhaId ? null : atual));
  };

  const ajustarQuantidadeLinha = (linhaId, delta) => {
    setCarrinho((atual) =>
      atual.map((linha) => {
        if (linha.linhaId !== linhaId) return linha;
        const nova = Math.max(0, Number((Number(linha.quantidade || 0) + delta).toFixed(3)));
        return { ...linha, quantidade: nova };
      })
    );
  };

  const ajustarQuantidadeAdicionar = (delta) => {
    setQuantidadeParaAdicionar((atual) => {
      const nova = Math.max(0, Number(((Number(atual) || 0) + delta).toFixed(3)));
      return String(nova);
    });
  };

  const linhasCalculadas = carrinho.map((linha) => {
    const produto = buscarProduto(linha.produtoId);
    if (!produto) return { ...linha, produto: null, calc: { precoUnitario: 0, margemAplicada: 0, subtotal: 0 } };
    const calc = calcularItemCarrinho(produto, linha.quantidade, linha.margemPercentual, linha.precoManual);
    return { ...linha, produto, calc };
  });

  const subtotalCarrinho = Number(linhasCalculadas.reduce((soma, linha) => soma + linha.calc.subtotal, 0).toFixed(2));
  const custoTotalCarrinho = Number(
    linhasCalculadas.reduce((soma, linha) => soma + (linha.produto ? Number(linha.quantidade || 0) * linha.produto.custoBase : 0), 0).toFixed(2)
  );
  const despesasNumero = Number(despesasAdicionais) || 0;
  const totalPagar = subtotalCarrinho;
  const lucroEstimado = Number((subtotalCarrinho - custoTotalCarrinho - despesasNumero).toFixed(2));

  const limparCarrinho = () => {
    setCarrinho([]);
    setClienteId('');
    setNumeroNota('');
    setDespesasAdicionais('');
    setLinhaEmEdicao(null);
    setErroCarrinho('');
  };

  const finalizarVenda = async () => {
    setErroCarrinho('');
    if (!clienteId) {
      setErroCarrinho('Selecione o cliente.');
      return;
    }
    if (linhasCalculadas.length === 0) {
      setErroCarrinho('Adicione pelo menos um produto ao carrinho.');
      return;
    }
    for (const linha of linhasCalculadas) {
      if (!linha.produto) continue;
      if (!linha.quantidade || Number(linha.quantidade) <= 0) {
        setErroCarrinho(`Informe a quantidade de "${linha.produto.nome}".`);
        return;
      }
      if (!Number.isInteger(Number(linha.quantidade))) {
        setErroCarrinho(`A quantidade de "${linha.produto.nome}" precisa ser um número inteiro, sem casas decimais.`);
        return;
      }
      if (Number(linha.quantidade) > estoqueDisponivelParaLinha(linha.linhaId, linha.produtoId)) {
        setErroCarrinho(`Estoque insuficiente para "${linha.produto.nome}".`);
        return;
      }
    }

    setFinalizando(true);
    try {
      await servicoApi.criarVenda({
        data,
        clienteId,
        numeroNota: numeroNota.trim(),
        despesasAdicionais: despesasNumero,
        itens: carrinho.map((linha) => ({
          produtoId: linha.produtoId,
          quantidade: Number(linha.quantidade),
          ...(linha.precoManual !== '' ? { precoUnitario: Number(linha.precoManual) } : {}),
          ...(linha.precoManual === '' && linha.margemPercentual !== '' ? { margemPercentual: Number(linha.margemPercentual) } : {})
        }))
      });
      limparCarrinho();
      await carregarTudo();
    } catch (erroCapturado) {
      setErroCarrinho(erroCapturado.message);
    } finally {
      setFinalizando(false);
    }
  };

  if (carregando) return <div className="vazio">Carregando vendas…</div>;

  return (
    <>
      <div className="produtos__cabecalho">
        <div>
          <h1 className="titulo-pagina">Vendas</h1>
          <p className="subtitulo-pagina">Monte o pedido, adicione quantos produtos quiser e finalize a venda</p>
        </div>
      </div>

      {erro && <div className="faixa-erro">{erro}</div>}

      {resumoMes && (
        <div className="linha-indicadores vendas__indicadores">
          <div className="cartao-indicador">
            <div className="cartao-indicador__rotulo">Receita do mês</div>
            <div className="cartao-indicador__valor">{formatarMoeda(resumoMes.receitaTotal)}</div>
          </div>
          <div className="cartao-indicador">
            <div className="cartao-indicador__rotulo">Custo do mês</div>
            <div className="cartao-indicador__valor">{formatarMoeda(resumoMes.custoTotal)}</div>
          </div>
          <div className="cartao-indicador">
            <div className="cartao-indicador__rotulo lucro">Lucro do mês</div>
            <div className="cartao-indicador__valor positivo">{formatarMoeda(resumoMes.lucroTotal)}</div>
          </div>
          <div className="cartao-indicador">
            <div className="cartao-indicador__rotulo">A receber</div>
            <div className="cartao-indicador__valor alerta">{formatarMoeda(resumoMes.aReceberTotal)}</div>
          </div>
        </div>
      )}

      <div className="venda-grid">
        <div className="cartao-venda">
          <div className="cartao-venda__cabecalho">
            <span className="cartao-venda__icone"><CalendarDays size={18} /></span>
            <h2>Dados da venda</h2>
          </div>
          <div className="cartao-venda__corpo">
            <div className="campo">
              <label>Data da venda</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="campo">
              <label>Cliente</label>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecione o cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {clientes.length === 0 && (
                <p className="campo__ajuda">
                  Nenhum cliente cadastrado ainda. Cadastre um na tela de <strong>Clientes</strong> antes de vender.
                </p>
              )}
            </div>
            <div className="campo">
              <label>Número da nota (opcional)</label>
              <input
                type="text"
                value={numeroNota}
                onChange={(e) => setNumeroNota(e.target.value)}
                placeholder="Ex: 145"
              />
            </div>

        

            <div className="campo">
              <label>Produto</label>
              <select
                className="campo-busca-produto"
                value={produtoParaAdicionar}
                onChange={(e) => setProdutoParaAdicionar(e.target.value)}
              >
                <option value="">Selecione o produto…</option>
                {produtos.map((produto) => {
                  const jaNoCarrinho = carrinho
                    .filter((linha) => linha.produtoId === produto.id)
                    .reduce((soma, linha) => soma + (Number(linha.quantidade) || 0), 0);
                  const disponivelParaAdicionar = Number((produto.estoqueAtual - jaNoCarrinho).toFixed(3));
                  return (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} ({rotuloTipo(produto.tipo)} — {disponivelParaAdicionar} {rotuloUnidade(produto.tipo)} disp.)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="linha-adicionar-produto-controles">
              <div className="campo">
                <label>Quantidade</label>
                <div className="stepper">
                  <button type="button" onClick={() => ajustarQuantidadeAdicionar(-1)} aria-label="Diminuir"><Minus size={16} /></button>
                  <input
                    type="number" min="0"
                    value={quantidadeParaAdicionar}
                    onChange={(e) => setQuantidadeParaAdicionar(e.target.value)}
                  />
                  <button type="button" onClick={() => ajustarQuantidadeAdicionar(1)} aria-label="Aumentar"><Plus size={16} /></button>
                </div>
              </div>
              <span className="etiqueta-unidade-adicionar">
                {produtoParaAdicionar ? rotuloUnidadePlural(buscarProduto(produtoParaAdicionar)?.tipo) : 'Litros'}
              </span>
              <button type="button" className="botao primario botao-adicionar-carrinho" onClick={adicionarAoCarrinho}>
                <Plus size={18} /> Adicionar ao carrinho
              </button>
            </div>
            {erroCarrinho && <div className="faixa-erro">{erroCarrinho}</div>}
          </div>
        </div>

        <div className="cartao-venda">
          <div className="cartao-venda__cabecalho">
            <span className="cartao-venda__icone"><ShoppingCart size={18} /></span>
            <h2>Produtos adicionados ({linhasCalculadas.length})</h2>
          </div>
          <div className="cartao-venda__corpo lista-itens-carrinho">
            {linhasCalculadas.length === 0 ? (
              <div className="vazio">Nenhum produto adicionado ainda. Escolha um produto acima.</div>
            ) : (
              linhasCalculadas.map((linha) => {
                if (!linha.produto) return null;
                const disponivel = estoqueDisponivelParaLinha(linha.linhaId, linha.produtoId);
                const margemExibida = linha.precoManual !== '' ? linha.calc.margemAplicada : linha.margemPercentual;
                const precoExibido = linha.precoManual !== '' ? linha.precoManual : linha.calc.precoUnitario;
                const emEdicao = linhaEmEdicao === linha.linhaId;
                const passo = 1;
                return (
                  <div className="item-carrinho" key={linha.linhaId}>
                    <div className="item-carrinho__principal">
                      <div className="item-carrinho__info">
                        <div className="item-carrinho__nome-linha">
                          <span className="item-carrinho__nome">{linha.produto.nome}</span>
                          <span className={`etiqueta-tipo ${linha.produto.tipo === 'litro' ? 'etiqueta-tipo--litro' : 'etiqueta-tipo--unidade'}`}>
                            {rotuloTipo(linha.produto.tipo)}
                          </span>
                        </div>
                        <div className="item-carrinho__meta">
                          <span>Código: {linha.produto.sku || '—'}</span>
                          <span>Estoque disp.: {disponivel} {rotuloUnidade(linha.produto.tipo)}</span>
                        </div>
                      </div>

                      <div className="item-carrinho__quantidade">
                        <label>Quantidade</label>
                        <div className="stepper">
                          <button type="button" onClick={() => ajustarQuantidadeLinha(linha.linhaId, -passo)} aria-label="Diminuir"><Minus size={15} /></button>
                          <input
                            type="number" min="0" step={linha.produto.tipo === 'litro' ? '0.01' : '1'}
                            value={linha.quantidade}
                            onChange={(e) => atualizarLinha(linha.linhaId, { quantidade: e.target.value })}
                          />
                          <button type="button" onClick={() => ajustarQuantidadeLinha(linha.linhaId, passo)} aria-label="Aumentar"><Plus size={15} /></button>
                        </div>
                      </div>

                      <div className="item-carrinho__valores">
                        <span className="texto-suave">{formatarMoeda(linha.produto.custoBase)} / {rotuloUnidade(linha.produto.tipo)}</span>
                        <span className="item-carrinho__subtotal">{formatarMoeda(linha.calc.subtotal)}</span>
                      </div>

                      <div className="item-carrinho__acoes">
                        <button
                          type="button"
                          className="botao-acao-item"
                          onClick={() => setLinhaEmEdicao(emEdicao ? null : linha.linhaId)}
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          type="button"
                          className="botao-acao-item botao-acao-item--perigo"
                          onClick={() => removerLinha(linha.linhaId)}
                        >
                          <Trash2 size={14} /> Remover
                        </button>
                      </div>
                    </div>

                    {emEdicao && (
                      <div className="item-carrinho__edicao">
                        <div className="campo">
                          <label>Margem %</label>
                          <input
                            type="number" step="0.01"
                            value={margemExibida}
                            onChange={(e) => atualizarLinha(linha.linhaId, { margemPercentual: e.target.value, precoManual: '' })}
                            placeholder={String(linha.produto.margemPadrao)}
                          />
                        </div>
                        <div className="campo">
                          <label>Preço unit.</label>
                          <input
                            type="number" min="0" step="0.01"
                            value={precoExibido}
                            onChange={(e) => atualizarLinha(linha.linhaId, { precoManual: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {linhasCalculadas.length > 0 && (
              <button type="button" className="botao-limpar-carrinho" onClick={limparCarrinho} disabled={finalizando}>
                <Trash2 size={15} /> Limpar carrinho
              </button>
            )}
          </div>

          <div className="cartao-venda__cabecalho cartao-venda__cabecalho--secao">
            <span className="cartao-venda__icone"><ClipboardList size={18} /></span>
            <h2>Resumo da venda</h2>
          </div>
          <div className="cartao-venda__corpo cartao-venda__corpo--resumo">
            <div className="resumo-linha">
              <span>Quantidade de itens</span>
              <strong>{linhasCalculadas.length}</strong>
            </div>

            <div className="campo resumo-campo-despesas">
              <label>Despesas adicionais (opcional)</label>
              <input
                type="number" min="0" step="0.01"
                value={despesasAdicionais}
                onChange={(e) => setDespesasAdicionais(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="resumo-divisor" />

            <div className="resumo-linha resumo-total">
              <span>Total a pagar</span>
              <strong>{formatarMoeda(totalPagar)}</strong>
            </div>
            <div className="resumo-linha resumo-custo">
              <span>Custo total</span>
              <span>{formatarMoeda(custoTotalCarrinho)}</span>
            </div>
            <div className="resumo-lucro">
              <span>Lucro estimado</span>
              <strong>{formatarMoeda(lucroEstimado)}</strong>
            </div>

            <button
              type="button"
              className="botao primario botao-finalizar-venda"
              onClick={finalizarVenda}
              disabled={finalizando || linhasCalculadas.length === 0}
            >
              {finalizando ? 'Finalizando…' : 'Finalizar venda'}
            </button>
          </div>
        </div>
      </div>

      <div className="secao secao--registro">
        <div className="secao__cabecalho secao__cabecalho--com-filtro">
          <div>
            <span className="secao__titulo">Vendas</span>
            <p className="secao__legenda">
              Cada produto tem seu próprio status e ação — marcar como pago ou cancelar um item não afeta os outros do mesmo pedido.
            </p>
          </div>
          <div className="filtro-mes filtro-busca-nota">
            <label htmlFor="busca-nota-vendas">Nº da nota</label>
            <input
              id="busca-nota-vendas"
              type="text"
              className="campo-busca-nota"
              value={buscaNota}
              onChange={(e) => setBuscaNota(e.target.value)}
              placeholder="Buscar nota…"
            />
          </div>
          <div className="filtro-mes">
            <label htmlFor="filtro-mes-vendas">Mês</label>
            <input
              id="filtro-mes-vendas"
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
            />
          </div>
        </div>
        {(() => {
          const buscaNotaNormalizada = buscaNota.trim().toLowerCase();
          const vendasDoMes = todasVendas.filter((venda) => {
            if (venda.criadoEm.slice(0, 7) !== mesFiltro) return false;
            if (!buscaNotaNormalizada) return true;
            return (venda.numeroNota || '').toLowerCase().includes(buscaNotaNormalizada);
          });
          if (todasVendas.length === 0) {
            return <div className="vazio">Nenhuma venda registrada ainda. Monte um pedido acima pra começar.</div>;
          }
          if (vendasDoMes.length === 0) {
            return (
              <div className="vazio">
                {buscaNotaNormalizada ? 'Nenhuma venda encontrada com esse número de nota.' : 'Nenhuma venda foi feita nesse mês ainda.'}
              </div>
            );
          }
          return (
            <div className="tabela-responsiva">
              <table>
                <thead>
                  <tr>
                    <th className="celula-status">Status</th>
                    <th>Nota</th>
                    <th>Produto</th>
                    <th className="celula-cliente">Cliente</th>
                    <th className="celula-mono">Preço unit.</th>
                    <th className="celula-mono">Margem</th>
                    <th className="celula-mono">Total</th>
                    <th className="celula-mono">Lucro</th>
                    <th>Data</th>
                    <th className="celula-acoes">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {construirLinhasTabelaVendas(vendasDoMes).map((linha) => (
                    <tr
                      key={linha.chave}
                      className={linha.venda.status === 'cancelada' ? 'painel__venda-cancelada' : ''}
                    >
                      <td className="celula-status">
                        <span className={`selo-pagamento ${linha.item.statusPagamento === 'pago' ? 'selo-pagamento--pago' : 'selo-pagamento--a-receber'}`}>
                          <span className="selo-pagamento__bolinha" />
                          {linha.item.statusPagamento === 'pago' ? 'Pago' : 'A receber'}
                        </span>
                      </td>
                      <td className="texto-suave">{linha.venda.numeroNota || '—'}</td>
                      <td className="texto-suave">
                        {linha.item.produtoNome} — {linha.item.quantidade}{rotuloUnidade(linha.item.tipo)}
                      </td>
                      <td className="celula-cliente">{linha.venda.cliente}</td>
                      <td className="mono">{formatarMoeda(linha.item.precoUnitario)}/{rotuloUnidade(linha.item.tipo)}</td>
                      <td className="mono">{linha.item.margemAplicada}%</td>
                      <td className="mono">{formatarMoeda(linha.item.subtotal)}</td>
                      <td className="mono">{formatarMoeda(linha.item.lucro)}</td>
                      <td className="texto-suave">{new Date(linha.venda.criadoEm).toLocaleDateString('pt-BR')}</td>
                      <td className="celula-acoes">
                        <div className="grupo-botoes-linha">
                          <button
                            type="button"
                            className="botao pequeno sucesso"
                            onClick={() => pagarItem(linha.venda, linha.item)}
                            disabled={linha.item.statusPagamento === 'pago'}
                          >
                            Pago
                          </button>
                          <button
                            type="button"
                            className="botao pequeno"
                            onClick={() => setItemEmEdicao({ venda: linha.venda, item: linha.item })}
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          <button type="button" className="botao pequeno perigo" onClick={() => cancelarItem(linha.venda, linha.item)}>
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {itemEmEdicao && (
        <EditarItemVenda
          venda={itemEmEdicao.venda}
          item={itemEmEdicao.item}
          clientes={clientes}
          aoFechar={() => setItemEmEdicao(null)}
          aoSalvar={salvarEdicaoItem}
        />
      )}
    </>
  );
}