import cluster from 'cluster'
import os from 'os'
import http from 'http'

if(cluster.isPrimary) {

    const numCPUs = os.cpus().length
    console.log(`Numero de cores del CPU: ${numCPUs}`)

    console.log("Generando clusters")
    for ( let i = 0; i < numCPUs; i++){
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker: ${worker.process.pid} ha finalizado.`)
        console.log('Creando un nuevo worker')
        cluster.fork() // Crear un nuevo worker cuando se cae uno.
    })

} else {
    const server = http.createServer((req, res) => {
        res.writeHead(200)
        res.end(`Identificador del worker secundario: ${process.pid}`)
    })

    server.listen(3000, () => {
        console.log(`Servidor escuchando en puerto 3000, manejado por el worker: ${process.pid}`)
    })
}