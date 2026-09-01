import { useEffect, useState } from 'react';
import { servicoApi } from '../../servicos/servicoApi';

const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DetalhesCliente({ clienteId, aoFechar }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    servicoApi
      .obterClienteDetalhes(clienteId)
      .then(setDados)
      .catch((erroCapturado) => setErro(erroCapturado.message))
      .finally(() => setCarregando(false));
  }, [clienteId]);

  return (
    <div className="fundo-modal" onClick={aoFechar}>
      <div className="modal modal--largo" onClick={(evento) => evento.stopPropagation()}>
        {carregando ? (
          <div className="vazio">Carregando detalhes…</div>
        ) : erro ? (
          <div className="faixa-erro">{erro}</div>
        ) : (
          <>
            <h2 className="modal__titulo">{dados.cliente.nome}</h2>

            <div className="detalhes-cliente__cadastro">
              <div>
                <span className="texto-suave">Telefone</span>
                <strong>{dados.cliente.telefone}</strong>
              </div>
              <div>
                <span className="texto-suave">E-mail</span>
                <strong>{dados.cliente.email || '—'}</strong>
              </div>
              <div>
                <span className="texto-suave">Endereço</span>
                <strong>{dados.cliente.endereco || '—'}</strong>
              </div>
              {dados.cliente.observacoes && (
                <div className="detalhes-cliente__observacoes">
                  <span className="texto-suave">Observações</span>
                  <p>{dados.cliente.observacoes}</p>
                </div>
              )}
            </div>

            <div className="linha-indicadores detalhes-cliente__indicadores">
              <div className="cartao-indicador">
                <div className="cartao-indicador__rotulo">Vendas feitas</div>
                <div className="cartao-indicador__valor">{dados.resumo.numeroVendas}</div>
              </div>
              <div className="cartao-indicador">
                <div className="cartao-indicador__rotulo">Total comprado</div>
                <div className="cartao-indicador__valor">{formatarMoeda(dados.resumo.receitaTotal)}</div>
              </div>
              <div className="cartao-indicador">
                <div className="cartao-indicador__rotulo">A receber</div>
                <div className="cartao-indicador__valor alerta">{formatarMoeda(dados.resumo.aReceberTotal)}</div>
              </div>
            </div>

            <h3 className="detalhes-cliente__subtitulo">Histórico de vendas</h3>

            {dados.vendas.length === 0 ? (
              <div className="vazio">Esse cliente ainda não tem nenhuma venda registrada.</div>
            ) : (
              <div className="tabela-responsiva detalhes-cliente__historico">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Produtos</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.vendas.map((venda) => (
                      <tr key={venda.id}>
                        <td className="texto-suave">{new Date(venda.criadoEm).toLocaleDateString('pt-BR')}</td>
                        <td className="texto-suave">
                          {(venda.itens || []).map((item) => item.produtoNome).join(', ') || '—'}
                        </td>
                        <td className="mono">{formatarMoeda(venda.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal__acoes">
              <button type="button" className="botao" onClick={aoFechar}>Fechar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
