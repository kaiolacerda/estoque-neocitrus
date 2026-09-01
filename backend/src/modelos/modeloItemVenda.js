const mongoose = require('mongoose');

// Cada linha do carrinho de uma venda. Guarda os valores NEGOCIADOS naquele
// momento (custo, margem aplicada, preço unitário) — assim o lucro real
// daquela venda nunca muda, mesmo que o produto seja editado depois.
const esquemaItemVenda = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendaId: { type: String, required: true },
    produtoId: { type: String, required: true },
    produtoNome: { type: String, required: true },
    produtoSku: { type: String, default: '' },
    tipo: { type: String, enum: ['litro', 'unidade'], required: true },
    quantidade: { type: Number, required: true },
    custoUnitarioMomento: { type: Number, required: true },
    margemAplicada: { type: Number, required: true },
    precoUnitario: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    custoTotal: { type: Number, required: true },
    lucro: { type: Number, required: true },
    // pra desfazer um pagamento marcado errado, cancela-se o item (não tem volta pra "a_receber")
    statusPagamento: { type: String, enum: ['a_receber', 'pago'], default: 'a_receber' }
  },
  { versionKey: false }
);

const ItemVendaMongo = mongoose.model('ItemVenda', esquemaItemVenda);

function limparDocumento(documento) {
  if (!documento) return null;
  const objeto = documento.toObject();
  delete objeto._id;
  return objeto;
}

const ModeloItemVenda = {
  async criarVarios(itens) {
    const documentos = await ItemVendaMongo.insertMany(itens);
    return documentos.map(limparDocumento);
  },

  async buscarPorId(id) {
    const documento = await ItemVendaMongo.findOne({ id });
    return limparDocumento(documento);
  },

  async porVenda(vendaId) {
    const documentos = await ItemVendaMongo.find({ vendaId });
    return documentos.map(limparDocumento);
  },

  async porVendas(vendaIds) {
    const documentos = await ItemVendaMongo.find({ vendaId: { $in: vendaIds } });
    return documentos.map(limparDocumento);
  },

  async todos() {
    const documentos = await ItemVendaMongo.find();
    return documentos.map(limparDocumento);
  },

  async atualizar(id, alteracoes) {
    const documento = await ItemVendaMongo.findOneAndUpdate({ id }, { $set: alteracoes }, { new: true });
    return limparDocumento(documento);
  },

  async removerPorId(id) {
    await ItemVendaMongo.deleteOne({ id });
  },

  async removerPorVenda(vendaId) {
    await ItemVendaMongo.deleteMany({ vendaId });
  }
};

module.exports = ModeloItemVenda;
