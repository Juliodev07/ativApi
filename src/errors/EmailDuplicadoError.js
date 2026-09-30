const ApiError = require("./ApiError");

// Exceção própria (status 409 - Conflict): não dá para reaproveitar
// AlunoInvalidoError (400) porque aqui os dados são válidos, o problema é o
// conflito com outro aluno já cadastrado.
class EmailDuplicadoError extends ApiError{
    constructor(message="Já existe um aluno cadastrado com este email", statusCode=409){
        super(message, statusCode);
    }
}

module.exports = EmailDuplicadoError;
