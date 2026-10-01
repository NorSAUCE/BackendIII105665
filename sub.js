process.send("hijo -> padre")
process.on('message', (msg) => {
    console.log("HIJO recibio mensaje ", msg)
})