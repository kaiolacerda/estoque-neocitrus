import { useState } from 'react';

const formularioVazio = {
  nome: '',
  telefone: '',
  email: '',
  endereco: '',
  observacoes: ''
};

export default function FormularioCliente({ cliente, aoFechar, aoSalvar }) {
  const emEdicao = Boolean(cliente);
  const [formulario, setFormulario] = useState(
    cliente
      ? {
          nome: cliente.nome || '',
          telefone: cliente.telefone || '',
          email: cliente.email || '',
          endereco: cliente.endereco || '',
          observacoes: cliente.observacoes || ''
        }
      : formularioVazio
  );
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const atualizarCampo = (campo) => (evento) => setFormulario({ ...formulario, [campo]: evento.target.value });

  const tratarEnvio = async (evento) => {
    evento.preventDefault();
    setErro('');
    if (!formulario.nome.trim()) {
      setErro('Preencha o nome do cliente.');
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
      <div className="modal" onClick={(evento) => evento.stopPropagation()}>
        <h2 className="modal__titulo">{emEdicao ? 'Editar cliente' : 'Novo cliente'}</h2>

        {erro && <div className="faixa-erro">{erro}</div>}

        <form onSubmit={tratarEnvio}>
          <div className="campo">
            <label>Nome</label>
            <input value={formulario.nome} onChange={atualizarCampo('nome')} placeholder="Ex: Comércio de Frutas Kondo Ltda." />
          </div>

          <div className="campo">
            <label>Telefone <span className="campo__opcional">(opcional)</span></label>
            <input value={formulario.telefone} onChange={atualizarCampo('telefone')} placeholder="Ex: (11) 91234-5678" />
          </div>

          <div className="campo">
            <label>E-mail <span className="campo__opcional">(opcional)</span></label>
            <input type="email" value={formulario.email} onChange={atualizarCampo('email')} placeholder="cliente@exemplo.com" />
          </div>

          <div className="campo">
            <label>Endereço <span className="campo__opcional">(opcional)</span></label>
            <input value={formulario.endereco} onChange={atualizarCampo('endereco')} placeholder="Rua, número, bairro, cidade" />
          </div>

          <div className="campo">
            <label>Observações <span className="campo__opcional">(opcional)</span></label>
            <textarea
              rows={3}
              value={formulario.observacoes}
              onChange={atualizarCampo('observacoes')}
              placeholder="Alguma anotação sobre esse cliente"
            />
          </div>

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