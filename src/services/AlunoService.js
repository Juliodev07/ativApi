const prisma = require("../databases/prisma");
const AlunoInvalidoError = require("../errors/AlunoInvalidoError");

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
