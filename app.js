let express = require('express')
let app = express()
let http = require('http').createServer(app)
let mongoose = require('mongoose');
const Account = require('./account');


const port = process.env.PORT || 2000

const mongoUrl = `mongodb+srv://admin:admin@cluster0.xpyw5.mongodb.net/doublep?retryWrites=true&w=majority`

mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(function () {
    console.log('connected');
})

app.get("/",function (request,response) {
        response.send("Hello 123")
})

app.get("/test",async function(req, res, next) {
    let accountList = await Account.find({}).lean();
    res.send(accountList);
})


http.listen(port,()=>{
    console.log(port)
})
