const { fork } = require('child_process')
const express = require('express')
const path = require('path')
require('dotenv').config()
const app = express()
const port = process.env.PORT

const logError = () => {
    console.log(puerto)
}

app.get('/', (req, res) => {
    logError()
    res.send()
})

app.get('/exit', (req, res) => {
    
    process.exit(0) //0 Termina la ejecucion SIN ERRORES
                    //1 Ocurrio un error general y termino sin exito.  
})

app.listen(port, () => {
    // const subProcess = fork(path.resolve(process.cwd(), 'sub.js'))
    // subProcess.on('message', (msg) => {
    //     console.log("PADRE recibio mensaje ", msg)
    //     subProcess.send("Padre -> Hijo")
    // })
    
    console.log(`Servidor escuchando en el puerto: ${port}`)
    
    process.on('uncaughtException', (error) => {
        console.log("Ha ocurrido un error inesperado en el sistema!", error)
        process.exit(1)
    })
    
    process.on('exit', () => {
        console.log("Cerrando conexion con DB");
    })
})



