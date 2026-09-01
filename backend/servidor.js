require('dotenv').config();
const aplicativo = require('./src/aplicativo');
const { conectarMongoDB } = require('./src/configuracao/conexaoMongo');
const { semearDadosIniciais } = require('./src/configuracao/semearDadosIniciais');

const PORTA = process.env.PORT || process.env.PORTA || 3001;

async function iniciar() {
  try {
    await conectarMongoDB();
    await semearDadosIniciais();
    aplicativo.listen(PORTA, () => {
      console.log(`API de estoque rodando em http://localhost:${PORTA}`);
    });
  } catch (erro) {
    console.error('❌ Não foi possível iniciar o servidor:', erro.message);
    process.exit(1);
  }
}

iniciar();
