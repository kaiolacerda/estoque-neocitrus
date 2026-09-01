const mongoose = require('mongoose');

// itens do pedido (o carrinho) ficam na coleção separada ItemVenda, ligados por vendaId
const esquemaVenda = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    numero: { type: String, required: true },
    numeroNota: { type: String, default: '', trim: true },
    data: { type: String, required: true },
    clienteId: { type: String },
    cliente: { type: String, required: true, trim: true },
    subtotal: { type: Number, required: true },
    despesasAdicionais: { type: Number, default: 0 },
    totalPagar: { type: Number, required: true },
    custoTotal: { type: Number, required: true },
    lucro: { type: Number, required: true },
    criadoEm: { type: String, required: true },
    status: { type: String, enum: ['concluida', 'cancelada'], default: 'concluida' }
  },
  { versionKey: false }
);

const VendaMongo = mongoose.model('Venda', esquemaVenda);

function limparDocumento(documento) {
  if (!documento) return null;
  const objeto = documento.toObject();
  delete objeto._id;
  return objeto;
}

const ModeloVenda = {
  async buscarPorId(id) {
    const documento = await VendaMongo.findOne({ id });
    return limparDocumento(documento);
  },

  async criar(venda) {
    const documento = await VendaMongo.create(venda);
    return limparDocumento(documento);
  },

  async todas() {
    const documentos = await VendaMongo.find();
    return documentos.map(limparDocumento);
  },

  async recentes(limite = 10) {
    const documentos = await VendaMongo.find().sort({ criadoEm: -1 }).limit(limite);
    return documentos.map(limparDocumento);
  },

  async listarOrdenadas() {
    const documentos = await VendaMongo.find().sort({ criadoEm: -1 });
    return documentos.map(limparDocumento);
  },

  async contarTodas() {
    return VendaMongo.countDocuments();
  },

  async atualizar(id, alteracoes) {
    const documento = await VendaMongo.findOneAndUpdate({ id }, { $set: alteracoes }, { new: true });
    return limparDocumento(documento);
  },

  async remover(id) {
    await VendaMongo.deleteOne({ id });
  }
};

module.exports = ModeloVenda;
