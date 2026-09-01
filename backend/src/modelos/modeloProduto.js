const mongoose = require('mongoose');

const esquemaProduto = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    nome: { type: String, required: true },
    sku: { type: String, trim: true, required: true, unique: true },
    tipo: { type: String, enum: ['litro', 'unidade'], default: 'litro', required: true },
    estoqueAtual: { type: Number, default: 0 },
    custoBase: { type: Number, default: 0 },
    margemPadrao: { type: Number, default: 0 },
    atualizadoEm: { type: String }
  },
  { versionKey: false }
);

const ProdutoMongo = mongoose.model('Produto', esquemaProduto);

function limparDocumento(documento) {
  if (!documento) return null;
  const objeto = documento.toObject();
  delete objeto._id;
  return objeto;
}

const ModeloProduto = {
  async listarTodos() {
    const documentos = await ProdutoMongo.find().sort({ nome: 1 });
    return documentos.map(limparDocumento);
  },

  async buscarPorId(id) {
    const documento = await ProdutoMongo.findOne({ id });
    return limparDocumento(documento);
  },

  async buscarPorSku(sku) {
    if (!sku) return null;
    const documento = await ProdutoMongo.findOne({ sku });
    return limparDocumento(documento);
  },

  async criar(produto) {
    const documento = await ProdutoMongo.create(produto);
    return limparDocumento(documento);
  },

  async atualizar(id, alteracoes) {
    const documento = await ProdutoMongo.findOneAndUpdate({ id }, { $set: alteracoes }, { new: true });
    return limparDocumento(documento);
  },

  async ajustarEstoque(id, delta) {
    const documento = await ProdutoMongo.findOneAndUpdate(
      { id },
      { $inc: { estoqueAtual: delta }, $set: { atualizadoEm: new Date().toISOString() } },
      { new: true }
    );
    return limparDocumento(documento);
  },

  async baixarEstoqueSeSuficiente(id, quantidade) {
    const documento = await ProdutoMongo.findOneAndUpdate(
      { id, estoqueAtual: { $gte: quantidade } },
      { $inc: { estoqueAtual: -quantidade }, $set: { atualizadoEm: new Date().toISOString() } },
      { new: true }
    );
    return limparDocumento(documento);
  },

  async remover(id) {
    await ProdutoMongo.deleteOne({ id });
  },

  async sincronizarIndices() {
    await ProdutoMongo.syncIndexes();
  }
};

module.exports = ModeloProduto;
