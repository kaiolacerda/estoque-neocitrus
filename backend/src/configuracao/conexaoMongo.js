const mongoose = require('mongoose');

async function conectarMongoDB() {
  const uri = process.env.URI_MONGODB;

  if (!uri) {
    throw new Error(
      'Defina a variável URI_MONGODB no arquivo backend/.env com a string de conexão do MongoDB Atlas.'
    );
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('Conectado ao MongoDB com sucesso.');
  await sincronizarIndices();
}

async function sincronizarIndices() {
  try {
    const ModeloProduto = require('../modelos/modeloProduto');
    await ModeloProduto.sincronizarIndices();
    const ModeloCliente = require('../modelos/modeloCliente');
    await ModeloCliente.sincronizarIndices();
  } catch (erro) {
    console.warn('Não foi possível sincronizar os índices da coleção de produtos:', erro.message);
  }
}

module.exports = { conectarMongoDB };
