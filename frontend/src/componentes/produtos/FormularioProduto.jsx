import { useState } from 'react';

const formularioVazio = {
  nome: '',
  sku: '',
  tipo: 'litro',
  estoqueAtual: '',
  custoBase: '',
  margemPadrao: ''
};

export default function FormularioProduto({ produto, aoFechar, aoSalvar }) {
  const emEdicao = Boolean(produto);
  const [formulario, setFormulario] = useState(
    produto
      ? {
          nome: produto.nome,
          sku: produto.sku || '',
          tipo: produto.tipo || 'litro',
          estoqueAtual: produto.estoqueAtual,
          custoBase: produto.custoBase,
          margemPadrao: produto.margemPadrao
        }
      : formularioVazio
  );
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const atualizarCampo = (campo) => (evento) => setFormulario({ ...formulario, [campo]: evento.target.value });

  const ehLitro = formulario.tipo === 'litro';
  const rotuloUnidade = ehLitro ? 'L' : 'un.';
  const custoBase = Number(formulario.custoBase) || 0;
  const margem = Number(formulario.margemPadrao) || 0;
  const margemValida = margem >= 0;
  const precoRecomendado = margemValida ? Number((custoBase * (1 + margem / 100)).toFixed(2)) : 0;

  const tratarEnvio = async (evento) => {
    evento.preventDefault();
    setErro('');
    if (!formulario.nome) {
      setErro('Preencha o nome do produto.');
      return;
    }
    if (!formulario.sku || !formulario.sku.trim()) {
      setErro('Preencha o SKU do produto.');
      return;
    }
    if (!margemValida) {
      setErro('A margem de lucro não pode ser negativa.');
      return;
    }
    if (!ehLitro && formulario.estoqueAtual !== '' && !Number.isInteger(Number(formulario.estoqueAtual))) {
      setErro('Produtos vendidos por unidade só aceitam estoque em números inteiros.');
      return;
    }
    setSalvando(true);
    try {
      await aoSalvar(formulario);
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fundo-modal" onClick={aoFechar}>
              <div className="modal modal--produto" onClick={(evento) => evento.stopPropagation()}>
        <h2 className="modal__titulo">{emEdicao ? 'Editar produto' : 'Novo produto'}</h2>

        {erro && <div className="faixa-erro">{erro}</div>}

        <form onSubmit={tratarEnvio}>
          <div className="campo">
            <label>Nome do produto</label>
            <input value={formulario.nome} onChange={atualizarCampo('nome')} placeholder="Ex: Oranza" />
          </div>

          <div className="campo">
            <label>SKU / código</label>
            <input value={formulario.sku} onChange={atualizarCampo('sku')} placeholder="Ex: ORZ-001" required />
          </div>

          <div className="campo">
            <label>Vendido por</label>
            <div className="seletor-tipo">
              <button
                type="button"
                className={ehLitro ? 'ativo' : ''}
                onClick={() => setFormulario({ ...formulario, tipo: 'litro' })}
              >
                Litro <span>aceita casas decimais (ex: 1,5 L)</span>
              </button>
              <button
                type="button"
                className={!ehLitro ? 'ativo' : ''}
                onClick={() => setFormulario({ ...formulario, tipo: 'unidade' })}
              >
                Unidade <span>só números inteiros (ex: 3 un)</span>
              </button>
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo">
              <label>Estoque atual ({rotuloUnidade})</label>
              <input
                type="number"
                min="0"
                step={ehLitro ? '0.01' : '1'}
                value={formulario.estoqueAtual}
                onChange={atualizarCampo('estoqueAtual')}
                placeholder="0"
              />
            </div>
            <div className="campo">
              <label>Custo base (por {ehLitro ? 'litro' : 'unidade'}, em R$)</label>
              <input type="number" min="0" step="0.01" value={formulario.custoBase} onChange={atualizarCampo('custoBase')} placeholder="0.00" />
            </div>
          </div>

          <div className="campo">
            <label>Margem de lucro padrão (%)</label>
            <input type="number" min="0" step="0.01" value={formulario.margemPadrao} onChange={atualizarCampo('margemPadrao')} placeholder="Ex: 25" />
            <p className="campo__ajuda">Pode ser alterada linha a linha na hora da venda, sem mudar esse valor cadastrado.</p>
          </div>

          {custoBase > 0 && margemValida && (
            <div className="resumo-venda">
              <span>Preço de venda recomendado (por {rotuloUnidade}):</span>
              <strong>R$ {precoRecomendado.toFixed(2)}</strong>
            </div>
          )}

          {custoBase > 0 && !margemValida && formulario.margemPadrao !== '' && (
            <div className="faixa-erro">A margem não pode ser negativa.</div>
          )}

          <div className="modal__acoes">
            <button type="button" className="botao" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="botao primario" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
