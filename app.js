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
let cors = require('cors');
let multer = require('multer');
const fs = require('fs');





app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());
app.use(cors())
app.use(express.static('uploads'))






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

app.post('/users/mobile/api/register', async (req, res) => {
    if (!fs.existsSync('./uploads/avatarUser')) {
        fs.mkdirSync('./uploads/avatarUser');
    }
    upload(req, res, async function (err) {
        if (err) {
            res.status(401).send({message: err.message, data: {}});
        }
        const account = new Account({
            phoneNumber: req.body.phoneNumber,
            password: req.body.password,
            fullName: req.body.fullName,
            typeAccount: 0,
            isShowUpdatePet: true,
            province: req.body.province,
            district: req.body.district,
            commune: req.body.commune,
            idToken: [req.body.idToken],
            isLocked: false,
        });
        if (req.file == undefined) {
            account.avatar = "file_config/default_avt.jpg";
        } else {
            let avt = req.file.path;
            account.avatar = avt.substring(8, avt.length);
            console.log(req.file.path);
        }
        await Account.findOne({'phoneNumber': account.phoneNumber}).then(data => {
            if (data == null) {
                try {
                    bcrypt.genSalt(10, (err, salt) => {
                        if (err) {
                            res.status(401).send({message: err.message, data: {}});
                        } else {
                            bcrypt.hash(account.password, salt, (err, hash) => {
                                if (err) {
                                    res.status(401).send({message: err});
                                } else {
                                    account.password = hash;
                                    account.save((err, result) => {
                                        if (err) {
                                            if (req.file != undefined) {
                                                fs.unlink(req.file.path, function (error, da) {
                                                    if (error) {
                                                        console.log(error.message);
                                                    } else {
                                                        console.log("error")
                                                    }
                                                });
                                            }
                                            res.status(401).send({message: "Failed", data: {}});
                                        } else {
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
                                                        province: account.province,
                                                        commune: account.commune,
                                                        district: account.district,
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            })
                        }
                    })
                } catch (e) {
                    if (req.file != undefined) {
                        fs.unlink(req.file.path, function (error, da) {
                            if (error) {
                                console.log(error.message);
                            } else {
                                console.log("error")
                            }
                        });
                    }
                    res.status(400).send({message: e.message, data: {}});

                }
            } else {
                if (req.file != undefined) {
                    fs.unlink(req.file.path, function (error, da) {
                        if (error) {
                            console.log(error.message);
                        } else {
                            console.log("error")
                        }
                    });
                }
                res.status(401).send({message: "account has been existed", data: {}});

            }
        }).catch(e => {
            if (req.file != undefined) {
                fs.unlink(req.file.path, function (error, da) {
                    if (error) {
                        console.log(error.message);
                    } else {
                        console.log("error")
                    }
                });
            }
            res.status(400).send({message: e.message, data: {}});

        });
    })
})

let storage = multer.diskStorage({
    destination: function (request, file, cb) {
        cb(null, './uploads/avatarUser');
    },
    filename: function (req, file, callback) {
        const hrtime = process.hrtime();
        callback(null, "avt" + ((hrtime[0] * 1e6) + (hrtime[1]) * 1e-3).toString() + file.originalname);
    }
})
let upload = multer({
    storage: storage, limits: {}, fileFilter: function (req, file, callback) {
        if (file.originalname == undefined) {
            callback(new Error("Not Found"), false);
        } else {
            callback(null, true);
        }
    }
}).single('avatar');


http.listen(port,()=>{
    console.log(port)
})
