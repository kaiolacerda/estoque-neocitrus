function manipuladorAssincrono(funcao) {
  return (req, res, proximo) => {
    Promise.resolve(funcao(req, res, proximo)).catch(proximo);
  };
}

module.exports = { manipuladorAssincrono };
