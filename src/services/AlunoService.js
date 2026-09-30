const prisma = require("../databases/prisma");
const AlunoInvalidoError = require("../errors/AlunoInvalidoError");
const AlunoNaoEncontradoError = require("../errors/AlunoNaoEncontradoError");

// Campos do model Aluno pelos quais é permitido ordenar
const CAMPOS_ORDENAVEIS = ["id", "nome", "email", "createdAt", "updatedAt"];
const DIRECOES = ["asc", "desc"];

class AlunoService{

    async findMany(page, pageSize, orderBy = "id", order = "asc"){
        // Valores fora da lista permitida não vão para o Prisma:
        // um campo inexistente ou uma direção inválida quebrariam a query.
        if(!CAMPOS_ORDENAVEIS.includes(orderBy)){
            throw new AlunoInvalidoError(
                `Campo de ordenação inválido. Use um destes: ${CAMPOS_ORDENAVEIS.join(", ")}.`
            );
        }
        if(!DIRECOES.includes(order)){
            throw new AlunoInvalidoError(
                'Direção de ordenação inválida. Use "asc" ou "desc".'
            );
        }

        // SELECT * FROM alunos ORDER BY <orderBy> <order> LIMIT ... OFFSET ...
        // count() conta todos os alunos do banco, não só os da página atual.
        const [alunos, total] = await Promise.all([
            prisma.aluno.findMany({
                skip: (page-1)*pageSize,
                take: Number(pageSize),
                orderBy: { [orderBy]: order }
            }),
            prisma.aluno.count()
        ]);

        return { alunos, total };
    }

    async findUnique(id){
        // O id chega como texto em request.params; no schema ele é Int.
        const idNumerico = Number(id);
        if(!Number.isInteger(idNumerico)){
            throw new AlunoInvalidoError("Id inválido.");
        }

        // SELECT * FROM alunos WHERE id = ?
        const aluno = await prisma.aluno.findUnique({
            where: { id: idNumerico }
        });

        // findUnique devolve null quando não existe registro
        if(!aluno){
            throw new AlunoNaoEncontradoError();
        }

        return aluno;
    }

    async create(aluno){
        const {nome, email} = aluno;
        if(!nome || !email){
            throw new AlunoInvalidoError();
        }
        //create = insert
        //update = update
        //delete = delete
        //findMany = select * from
        const novoAluno = await prisma.aluno.create({data:aluno});

        return novoAluno;
    }
}

module.exports = new AlunoService();
