require('dotenv/config');
const express = require("express")
const alunoRoutes = require("./routes/alunoRoutes");

const app = express();
app.use(express.json());
app.use((request, response, next)=>{
    console.log("Executando antes das rotas");
    next();
});
app.use("/alunos", alunoRoutes);

app.listen(process.env.PORT, ()=>{
    console.log(`Server running on port ${process.env.PORT}`);
});

