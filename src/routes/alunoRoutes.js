const express = require("express");
const alunoController = require("../controllers/AlunoController");
const validarAluno = require("../middlewares/validarAluno");

const router = express.Router();

router.get("/",(request, response, next)=>{
    console.log("Executando antes do findMany");
    next();
}, alunoController.findMany);
router.post("/", validarAluno, alunoController.create);

module.exports = router;