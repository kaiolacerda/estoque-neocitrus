const mongoose = require('mongoose');

const esquemaCliente = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, trim: true },
    // Campos extras, todos opcionais — só aparecem na tela de Detalhes.
    email: { type: String, trim: true },
    endereco: { type: String, trim: true },
    observacoes: { type: String, trim: true },
    criadoEm: { type: String, required: true },
    atualizadoEm: { type: String }
  },
  { versionKey: false }
);

const ClienteMongo = mongoose.model('Cliente', esquemaCliente);

function limparDocumento(documento) {
  if (!documento) return null;
  const objeto = documento.toObject();
  delete objeto._id;
  return objeto;
}

const ModeloCliente = {
  async listarTodos() {
    const documentos = await ClienteMongo.find().sort({ nome: 1 });
    return documentos.map(limparDocumento);
  },

  async buscarPorId(id) {
    const documento = await ClienteMongo.findOne({ id });
    return limparDocumento(documento);
  },

  async criar(cliente) {
    const documento = await ClienteMongo.create(cliente);
    return limparDocumento(documento);
  },

  async atualizar(id, alteracoes) {
    const documento = await ClienteMongo.findOneAndUpdate({ id }, { $set: alteracoes }, { new: true });
    return limparDocumento(documento);
  },

  async remover(id) {
    await ClienteMongo.deleteOne({ id });
  },

  async sincronizarIndices() {
    await ClienteMongo.syncIndexes();
  }
};

module.exports = ModeloCliente;