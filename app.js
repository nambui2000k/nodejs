let express = require('express')
let app = express()
let http = require('http').createServer(app)
let mongoose = require('mongoose');
const Account = require('./account');
const SECRET_TOKEN = "doublep-scret";
const TypePet = require('./typepet');
const verify = require('./verifyToken');
const bcrypt = require('bcrypt');
const bodyparser = require('body-parser');
const jwt = require('jsonwebtoken');




app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());




const port = process.env.PORT || 2000
let BASE_URL= process.env.BASE_URL || "http://localhost:"+port+"/"
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

app.post('/users/mobile/api/login', async (req, res) => {
    console.log(req.body.phoneNumber)
    Account.findOne({
        phoneNumber: req.body.phoneNumber,
    }, (err, account) => {
        if (err) {
            res.status(401).send({message: err.message, data: {}}); //loi o day//
        } else if (account == null) {
            res.status(401).send({message: "Error number phone or password", data: {}});
        } else {
            bcrypt.compare(req.body.password, account.password, async(err, isMatch) =>  {
                if (err) {
                    res.status(401).send({
                        message: err.message,
                        data: {}
                    });
                } else if (isMatch == true) {
                    if (account.isLocked) {
                        res.status(403).send({message: "This account was banned. Please contact to Admin.", data: {}});
                    } else {
                        account = await Account.findOneAndUpdate({phoneNumber: account.phoneNumber}, {$addToSet: {idToken: req.body.idToken}}, (err, account) => {
                        });
                        const token = jwt.sign({_id: account._id}, SECRET_TOKEN);
                        res.status(200).header("Authorization", token).send({
                            message: "Success", data: {
                                token: token,
                                account: {
                                    idPets: account.idPets,
                                    idNews: account.idNews,
                                    idGroup: account.idGroup,
                                    idToken: account.idToken,
                                    idNotification: account.idNotification,
                                    _id: account._id,
                                    phoneNumber: account.phoneNumber,
                                    fullName: account.fullName,
                                    typeAccount: account.typeAccount,
                                    isShowUpdatePet: account.isShowUpdatePet,
                                    avatar: BASE_URL + account.avatar,
                                    longitude: account.longitude,
                                    latitude: account.latitude,
                                    currentPet: account.currentPet,
                                    province: account.province,
                                    commune: account.commune,
                                    district: account.district,
                                }
                            }
                        });
                    }
                } else {
                    res.status(401).send({message: "Error number phone or password", data: {}});
                }
            })
        }
    })

})

app.get('/pets/mobile/api/pet/typePet', verify, async (req, res) => {
    let typePet = await TypePet.find({}).lean();
    res.status(200).send({
        message: "Success", data: {
            typePet: typePet
        }
    });
});


http.listen(port,()=>{
    console.log(port)
})
