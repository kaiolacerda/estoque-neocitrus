import { useState } from 'react';

const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function rotuloUnidade(tipo) {
  return tipo === 'litro' ? 'L' : 'un.';
}

export default function EditarItemVenda({ venda, item, clientes, aoFechar, aoSalvar }) {
  const [clienteId, setClienteId] = useState(venda.clienteId || '');
  const [data, setData] = useState(venda.data || '');
  const [numeroNota, setNumeroNota] = useState(venda.numeroNota || '');
  const [precoUnitario, setPrecoUnitario] = useState(String(item.precoUnitario));
  const [margemPercentual, setMargemPercentual] = useState(String(item.margemAplicada));
  // qual dos dois campos (preço ou margem) foi editado por último — o outro é recalculado a partir dele
  const [campoAtivo, setCampoAtivo] = useState('preco');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const custoUnitario = item.custoUnitarioMomento;

  const precoCalculado = campoAtivo === 'margem'
    ? Number((custoUnitario * (1 + (Number(margemPercentual) || 0) / 100)).toFixed(2))
    : Number(precoUnitario) || 0;

  const margemCalculada = campoAtivo === 'preco'
    ? (custoUnitario > 0 ? Number((((Number(precoUnitario) || 0) - custoUnitario) / custoUnitario * 100).toFixed(2)) : 0)
    : (Number(margemPercentual) || 0);

  const subtotalPrevia = Number((item.quantidade * precoCalculado).toFixed(2));
  const custoTotalPrevia = Number((item.quantidade * custoUnitario).toFixed(2));
  const lucroPrevia = Number((subtotalPrevia - custoTotalPrevia).toFixed(2));

  const tratarEnvio = async (evento) => {
    evento.preventDefault();
    setErro('');
    if (!clienteId) {
      setErro('Selecione o cliente.');
      return;
    }
    if (!data) {
      setErro('Informe a data da venda.');
      return;
    }
    const precoNum = campoAtivo === 'preco' ? Number(precoUnitario) : precoCalculado;
    if (Number.isNaN(precoNum) || precoNum < 0) {
      setErro('Informe um preço unitário válido.');
      return;
    }

    setSalvando(true);
    try {
      const payload = { clienteId, data, numeroNota: numeroNota.trim() };
      if (campoAtivo === 'preco') {
        payload.precoUnitario = Number(precoUnitario);
      } else {
        payload.margemPercentual = Number(margemPercentual);
      }
      await aoSalvar(payload);
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fundo-modal" onClick={aoFechar}>
      <div className="modal" onClick={(evento) => evento.stopPropagation()}>
        <h2 className="modal__titulo">Editar venda</h2>
        <p className="campo__ajuda" style={{ marginTop: -12, marginBottom: 16 }}>
          {item.produtoNome} — {item.quantidade}{rotuloUnidade(item.tipo)}
        </p>

        {erro && <div className="faixa-erro">{erro}</div>}

        <form onSubmit={tratarEnvio}>
          <div className="campo">
            <label>Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecione o cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Data da venda</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div className="campo">
            <label>Número da nota</label>
            <input
              type="text"
              value={numeroNota}
              onChange={(e) => setNumeroNota(e.target.value)}
              placeholder="Ex: 145"
            />
          </div>

          <div className="linha-campos">
            <div className="campo">
              <label>Preço unit. (por {rotuloUnidade(item.tipo)})</label>
              <input
                type="number" min="0" step="0.01"
                value={campoAtivo === 'preco' ? precoUnitario : precoCalculado}
                onFocus={() => setCampoAtivo('preco')}
                onChange={(e) => { setCampoAtivo('preco'); setPrecoUnitario(e.target.value); }}
              />
            </div>
            <div className="campo">
              <label>Margem %</label>
              <input
                type="number" step="0.01"
                value={campoAtivo === 'margem' ? margemPercentual : margemCalculada}
                onFocus={() => setCampoAtivo('margem')}
                onChange={(e) => { setCampoAtivo('margem'); setMargemPercentual(e.target.value); }}
              />
            </div>
          </div>
          <p className="campo__ajuda">Editar um dos dois recalcula o outro automaticamente.</p>

          <div className="resumo-venda">
            <span>Total do item</span>
            <strong>{formatarMoeda(subtotalPrevia)}</strong>
          </div>
          <div className="resumo-venda">
            <span>Lucro do item</span>
            <strong>{formatarMoeda(lucroPrevia)}</strong>
          </div>

          <div className="modal__acoes">
            <button type="button" className="botao" onClick={aoFechar} disabled={salvando}>Cancelar</button>
            <button type="submit" className="botao primario" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
