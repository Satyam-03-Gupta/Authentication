require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const userModel = require('./models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Middleware to check if user is logged in
const checkAuth = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        let user = await userModel.findOne({ email: decoded.email });
        req.user = user || null; // Attach user data or set to null
    } catch (err) {
        req.user = null;
    }
    next();
};

// Home Route - Render with user info if logged in
app.get('/', checkAuth, (req, res) => {
    res.render('index', { user: req.user });
});

app.get('/createuser', (req, res) => {
    res.render('createuser');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// Signup Route
app.post('/create', async (req, res) => {
    try {
        let { username, email, password, age, profileImage } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        let createdUser = await userModel.create({
            username,
            email,
            password: hash,
            age,
            profileImage // Store profile image URL in DB
        });

        let token = jwt.sign({ email, username }, JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, { httpOnly: true });
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Error creating user");
    }
});

// Login Route
app.post('/login', async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.body.email });
        if (!user) return res.status(400).send("User not found");

        const result = await bcrypt.compare(req.body.password, user.password);
        if (result) {
            let token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
            res.cookie("token", token, { httpOnly: true });
            res.redirect('/');
        } else {
            res.status(400).send("Incorrect email or password");
        }
    } catch (err) {
        res.status(500).send("Error logging in");
    }
});

// Logout Route
app.post("/logout", (req, res) => {
    res.clearCookie("token", { path: '/' });
    res.redirect("/");
});



// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
