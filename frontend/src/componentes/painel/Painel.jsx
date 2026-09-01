import { useEffect, useState } from 'react';
import { Package, Archive, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { servicoApi } from '../../servicos/servicoApi';
 
const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const CORES_SAUDE_ESTOQUE = { saudavel: '#59e10b', baixo: '#168fd5', zerado: '#4c0e97' };
 
function GraficoSaudeEstoque({ situacoes, limiteBaixo }) {
  const [situacaoAtiva, setSituacaoAtiva] = useState(null);
  const selecionarSituacao = (situacao) => setSituacaoAtiva((atual) => (atual === situacao ? atual : situacao));
  const total = situacoes.reduce((soma, item) => soma + item.quantidade, 0);
  const ativa = situacoes.find((item) => item.situacao === situacaoAtiva) || situacoes[0];
  const raio = 42;
  const circunferencia = 2 * Math.PI * raio;
  let deslocamento = 0;
 
  if (!situacoes.length || !total) {
    return <div className="painel__grafico-vazio">Cadastre produtos para acompanhar a saúde do estoque.</div>;
  }
 
  return (
    <div className="painel__grafico-conteudo">
      <div className="painel__donut-area">
        <svg className="painel__donut" viewBox="0 0 120 120" role="img" aria-label="Proporção de produtos por situação de estoque">
          <circle className="painel__donut-trilha" cx="60" cy="60" r={raio} />
          {situacoes.filter((item) => item.quantidade > 0).map((item) => {
            const tamanho = (item.quantidade / total) * circunferencia;
            const inicio = deslocamento;
            deslocamento += tamanho;
            const ativo = item.situacao === ativa.situacao;
 
            return (
              <circle
                key={item.situacao}
                className={`painel__donut-fatia${ativo ? ' ativo' : ''}`}
                cx="60"
                cy="60"
                r={raio}
                stroke={CORES_SAUDE_ESTOQUE[item.situacao]}
                strokeDasharray={`${tamanho} ${circunferencia - tamanho}`}
                strokeDashoffset={-inicio}
                onMouseEnter={() => selecionarSituacao(item.situacao)}
                onFocus={() => selecionarSituacao(item.situacao)}
                onClick={() => selecionarSituacao(item.situacao)}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault();
                    selecionarSituacao(item.situacao);
                  }
                }}
                tabIndex="0"
                role="button"
                aria-label={`${item.rotulo}: ${item.quantidade} produtos`}
              />
            );
          })}
        </svg>
        <div className="painel__donut-centro" aria-live="polite">
          <strong>{Math.round((ativa.quantidade / total) * 100)}%</strong>
          <span>{ativa.rotulo}</span>
        </div>
      </div>
 
      <div className="painel__informacoes-grafico">
        <ul className="painel__legenda-grafico">
        {situacoes.map((item) => {
          const ativo = item.situacao === ativa.situacao;
          return (
            <li key={item.situacao}>
              <button
                type="button"
                className={ativo ? 'ativo' : ''}
                onMouseEnter={() => selecionarSituacao(item.situacao)}
                onFocus={() => selecionarSituacao(item.situacao)}
                onClick={() => selecionarSituacao(item.situacao)}
              >
                <span className="painel__legenda-cor" style={{ backgroundColor: CORES_SAUDE_ESTOQUE[item.situacao] }} />
                <span className="painel__legenda-nome">{item.rotulo}</span>
                <span className="painel__legenda-valor">{item.quantidade} prod.</span>
              </button>
            </li>
          );
        })}
        </ul>
        <div className="painel__detalhe-situacao" aria-live="polite">
          <div>
            <strong>{ativa.quantidade} {ativa.quantidade === 1 ? 'produto' : 'produtos'}</strong>
            <span>{ativa.situacao === 'saudavel' ? `Mais de ${limiteBaixo} unidades` : ativa.situacao === 'baixo' ? `Entre 1 e ${limiteBaixo} unidades` : 'Quantidade zerada'}</span>
          </div>
          {ativa.produtos.length > 0 && (
            <ul>{ativa.produtos.map((produto) => <li key={produto.id}>{produto.nome} <span>({produto.quantidade} un.)</span></li>)}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
 
export default function Painel() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
 
  useEffect(() => {
    servicoApi.obterPainel().then(setDados).finally(() => setCarregando(false));
  }, []);
 
  if (carregando) return <div className="vazio">Carregando painel…</div>;
  if (!dados) return <div className="vazio">Não foi possível carregar os dados.</div>;
 
  return (
    <>
      <h1 className="titulo-pagina painel__intro">Painel</h1>
      <p className="subtitulo-pagina">Visão geral do estoque e das vendas em tempo real</p>
 
      <div className="linha-indicadores painel__indicadores">
        <div className="cartao-indicador">
          <div className="cartao-indicador__texto">
            <div className="cartao-indicador__rotulo">Unidades em estoque</div>
            <div className="cartao-indicador__valor">{dados.totalUnidades} un</div>
          </div>
          <div className="cartao-indicador__icone"><Package /></div>
        </div>
 
        <div className="cartao-indicador">
          <div className="cartao-indicador__texto">
            <div className="cartao-indicador__rotulo">Litros em estoque</div>
            <div className="cartao-indicador__valor">{dados.totalLitros} L</div>
          </div>
          <div className="cartao-indicador__icone"><Archive /></div>
        </div>
 
        <div className="cartao-indicador">
          <div className="cartao-indicador__texto">
            <div className="cartao-indicador__rotulo">Faturamento anual</div>
            <div className="cartao-indicador__valor">{formatarMoeda(dados.faturamentoAnualTotal)}</div>
          </div>
          <div className="cartao-indicador__icone"><DollarSign /></div>
        </div>
 
        <div className="cartao-indicador">
          <div className="cartao-indicador__texto">
            <div className="cartao-indicador__rotulo">Lucro do mês</div>
            <div className="cartao-indicador__valor positivo">{formatarMoeda(dados.lucroDoMes)}</div>
          </div>
          <div className="cartao-indicador__icone"><TrendingUp /></div>
        </div>
      </div>
 
      <div className="linha-indicadores painel__cartao-receber">
        <div className="cartao-indicador">
          <div className="cartao-indicador__texto">
            <div className="cartao-indicador__rotulo">A receber</div>
            <div className="cartao-indicador__valor alerta">{formatarMoeda(dados.aReceberMes)}</div>
          </div>
          <div className="cartao-indicador__icone"><Wallet /></div>
        </div>
      </div>
 
      <div className="secao">
        <div className="secao__cabecalho">
          <span className="secao__titulo">Vendas recentes</span>
        </div>
        {dados.vendasRecentes.length === 0 ? (
          <div className="vazio">Nenhuma venda registrada ainda. Use a tela de Vendas para montar um pedido.</div>
        ) : (
          <div className="tabela-responsiva">
            <table>
              <thead>
              <tr>
                <th>Pedido</th>
                <th>Itens</th>
                <th>Receita</th>
                <th>Lucro</th>
                <th>Data</th>
              </tr>
              </thead>
              <tbody>
              {dados.vendasRecentes.map((venda) => (
                <tr key={venda.id} className={venda.status === 'cancelada' ? 'painel__venda-cancelada' : ''}>
                  <td className="mono">{venda.numero}</td>
                  <td className="texto-suave">
                    {venda.itens && venda.itens.length > 0
                      ? venda.itens.map((item) => `${item.produtoNome} (${item.quantidade}${item.tipo === 'litro' ? 'L' : 'un'})`).join(', ')
                      : '—'}
                  </td>
                  <td className="mono">{formatarMoeda(venda.totalPagar)}</td>
                  <td className="mono">{formatarMoeda(venda.lucro)}</td>
                  <td className="texto-suave">{new Date(venda.criadoEm).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
 
      <section className="painel__secao-grafico" aria-labelledby="titulo-saude-estoque">
        <div className="painel__secao-grafico-cabecalho">
          <div>
            <h2 id="titulo-saude-estoque">Saúde do estoque</h2>
            <p>Produtos que precisam ou não de reposição</p>
          </div>
          <span>{dados.totalProdutos} produtos</span>
        </div>
        <GraficoSaudeEstoque situacoes={dados.saudeEstoque || []} limiteBaixo={dados.limiteEstoqueBaixo || 10} />
      </section>
    </>
  );
}
 