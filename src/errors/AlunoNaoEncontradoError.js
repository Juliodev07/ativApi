const ApiError = require("./ApiError");

class AlunoNaoEncontradoError extends ApiError{
    constructor(message="Aluno não encontrado", statusCode=404){
        super(message, statusCode);
    }
}

module.exports = AlunoNaoEncontradoError;
