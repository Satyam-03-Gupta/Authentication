const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const userModel = require('./models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/createuser', (req, res) => {
    res.render('createuser');
});


app.post('/create', async (req, res) => {
    let { username, email, password, age } = req.body;

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let createdUser = await userModel.create({
                username,
                email,
                password: hash,
                age
            });

            let token = jwt.sign({ email }, "kingshuk");
            res.cookie("token", token);
            // res.send(createdUser);
            res.redirect('/login');
        })
    })

});

app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', async function (req, res) {
    let user = await userModel.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("User not found");

    bcrypt.compare(req.body.password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: user.email }, "kingshuk");
            res.cookie("token", token);
            // res.send("Logged in");
            res.redirect('/');
        }
        else res.send("Incorrect email or password");
    });
});
app.post("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/");
});

app.listen(3000);