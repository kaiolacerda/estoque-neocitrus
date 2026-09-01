import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { servicoApi } from '../../servicos/servicoApi';
import FormularioProduto from './FormularioProduto';

const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ListaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [emEdicao, setEmEdicao] = useState(null); // null | 'novo' | produto

  const carregar = () => {
    setCarregando(true);
    servicoApi
      .obterProdutos()
      .then(setProdutos)
      .catch((erroCapturado) => setErro(erroCapturado.message))
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const tratarSalvar = async (formulario) => {
    if (emEdicao === 'novo') {
      await servicoApi.criarProduto(formulario);
    } else {
      await servicoApi.atualizarProduto(emEdicao.id, formulario);
    }
    setEmEdicao(null);
    carregar();
  };

  const tratarRemocao = async (produto) => {
    if (!confirm(`Remover "${produto.nome}" do estoque?`)) return;
    await servicoApi.removerProduto(produto.id);
    carregar();
  };

  return (
    <>
      <div className="produtos__cabecalho">
        <div>
          <h1 className="titulo-pagina">Produtos</h1>
          <p className="subtitulo-pagina">Cadastro e controle de quantidades em estoque</p>
        </div>
        <div className="produtos__acoes">
          <button className="botao primario" onClick={() => setEmEdicao('novo')}>+ Novo produto</button>
        </div>
      </div>

      {erro && <div className="faixa-erro">{erro}</div>}

      {!carregando && (
        <div className="linha-indicadores produtos__indicadores">
          <div className="cartao-indicador">
            <div className="cartao-indicador__texto">
              <div className="cartao-indicador__rotulo">Produtos cadastrados</div>
              <div className="cartao-indicador__valor">{produtos.length}</div>
            </div>
            <div className="cartao-indicador__icone"><Package /></div>
          </div>
        </div>
      )}

      <div className="secao">
        {carregando ? (
          <div className="vazio">Carregando produtos…</div>
        ) : produtos.length === 0 ? (
          <div className="vazio">Nenhum produto cadastrado ainda. Clique em "Novo produto" para começar.</div>
        ) : (
          <div className="tabela-responsiva">
            <table>
              <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th>Tipo</th>
                <th>Estoque</th>
                <th>Custo base</th>
                <th>Margem</th>
                <th>Preço recomendado</th>
                <th></th>
              </tr>
              </thead>
              <tbody>
              {produtos.map((produto) => {
                const ehLitro = produto.tipo === 'litro';
                const rotuloUnidade = ehLitro ? 'L' : 'un.';
                const precoRecomendado = produto.custoBase * (1 + (produto.margemPadrao || 0) / 100);
                return (
                  <tr key={produto.id}>
                    <td>{produto.nome}</td>
                    <td className="mono texto-suave">{produto.sku || '—'}</td>
                    <td>
                      <span className={`etiqueta-tipo ${ehLitro ? 'etiqueta-tipo--litro' : 'etiqueta-tipo--unidade'}`}>
                        {ehLitro ? 'Litro' : 'Unidade'}
                      </span>
                    </td>
                    <td className="mono">{produto.estoqueAtual} {rotuloUnidade}</td>
                    <td className="mono texto-suave">{formatarMoeda(produto.custoBase)} / {rotuloUnidade}</td>
                    <td className="mono texto-suave">{produto.margemPadrao}%</td>
                    <td className="mono">{formatarMoeda(precoRecomendado)}</td>
                    <td>
                      <div className="produtos__acoes-tabela">
                        <button className="botao pequeno" onClick={() => setEmEdicao(produto)}>Editar</button>
                        <button className="botao pequeno perigo" onClick={() => tratarRemocao(produto)}>Remover</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {emEdicao && (
        <FormularioProduto
          produto={emEdicao === 'novo' ? null : emEdicao}
          aoFechar={() => setEmEdicao(null)}
          aoSalvar={tratarSalvar}
        />
      )}

    </>
  );
}
