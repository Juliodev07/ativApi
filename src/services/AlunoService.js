const prisma = require("../databases/prisma");
const AlunoInvalidoError = require("../errors/AlunoInvalidoError");
const AlunoNaoEncontradoError = require("../errors/AlunoNaoEncontradoError");
const EmailDuplicadoError = require("../errors/EmailDuplicadoError");
const alunoSchema = require("../schemas/alunoSchema");

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

    async update(id, dados){
        const idNumerico = Number(id);
        if(!Number.isInteger(idNumerico)){
            throw new AlunoInvalidoError("Id inválido.");
        }

        // Dados inválidos: reaproveita AlunoInvalidoError (400), pois é o mesmo
        // tipo de problema do create (dados enviados fora do esperado).
        // O schema parcial aceita nome e/ou email e descarta qualquer outro campo.
        const resultado = alunoSchema.partial().safeParse(dados ?? {});
        if(!resultado.success){
            const mensagem = resultado.error.issues.map((i)=> i.message).join(" ");
            throw new AlunoInvalidoError(mensagem);
        }
        const data = resultado.data;
        if(Object.keys(data).length === 0){
            throw new AlunoInvalidoError("Informe nome e/ou email para atualizar.");
        }

        // Aluno não encontrado: reaproveita a exceção do findUnique (404).
        // Também confirma que o aluno existe antes do update.
        await this.findUnique(idNumerico);

        // Email duplicado: exceção própria (409). Verifica se o email já
        // pertence a OUTRO aluno (o próprio aluno pode reenviar o mesmo email).
        if(data.email){
            const existente = await prisma.aluno.findUnique({
                where: { email: data.email }
            });
            if(existente && existente.id !== idNumerico){
                throw new EmailDuplicadoError();
            }
        }

        try{
            // UPDATE alunos SET ... WHERE id = ?
            return await prisma.aluno.update({
                where: { id: idNumerico },
                data
            });
        }catch(e){
            // P2002 = violação de @unique (proteção contra condição de corrida)
            if(e.code === "P2002"){
                throw new EmailDuplicadoError();
            }
            throw e;
        }
    }

    async delete(id){
        const idNumerico = Number(id);
        if(!Number.isInteger(idNumerico)){
            throw new AlunoInvalidoError("Id inválido.");
        }

        // Aluno não encontrado: findUnique já lança AlunoNaoEncontradoError (404)
        await this.findUnique(idNumerico);

        // DELETE FROM alunos WHERE id = ?
        await prisma.aluno.delete({
            where: { id: idNumerico }
        });
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
