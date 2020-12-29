let express = require('express')
let app = express()
let http = require('http').createServer(app)

const port = process.env.PORT || 2000

app.get("/",function (request,response) {
        response.send("Hello 123")
})

http.listen(port,()=>{
    console.log(port)
})
