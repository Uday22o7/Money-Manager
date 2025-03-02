const express = require("express");
const path = require('path')
const ejsMate = require("ejs-mate")
const mongoose = require("mongoose");
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const app = express();
const port = 8000;
const mongoURI = process.env.MONGO_URI;
const db = "mongodb://127.0.0.1:27017/Money_Manager"
const User = require("./models/User")
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

dotenv.config()

// mongoose connection
mongoose.connect(db)
    .then(() => {
        console.log('mongo Connection is successful');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });


// middleware
app.set('view engine', 'ejs')
app.engine('ejs', ejsMate)
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('cookie-parser')());

const categories = ["Salary", "Freelance", "Investment Returns", "Gifts", "Rental Income", "Bonus", "Interest Income", "Food", "Transport", "Healthcare", "Shopping", "Entertainment", "Utilities", "Rent", "Mortgage", "Insurance", "Education", "Travel", "Clothing", "Charity", "Subscriptions", "Personal Care", "Groceries", "Dining Out", "Gifts", "Childcare", "Pets", "Taxes", "Miscellaneous"];

// Authentication middleware
const generateToken = (user) => {
    return jwt.sign({ id: user._id }, 'your-secret-key', { expiresIn: '1h' });
};

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/auth');
    
    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) return res.redirect('/auth');
        req.user = decoded;
        next();
    });
};



// Routes

app.get("/",(req,res)=>{
    res.render("./landingPage.ejs")
});

app.get("/auth",(req,res)=>{
    res.render("./authPage.ejs")
});

app.get('/dashboard', verifyToken, (req, res) => {
    res.render('./dashboard.ejs', { user: req.user });
    console.log(req.user);
});

app.post('/register', async (req, res) => {
    try {
        const {username,email,password} = req.body;
        console.log(username,email,password)
        const user = new User({
            username:username,
            email: email,
            password: password // Schema will auto-hash
        });
        console.log(user)
        // Save the user to the database
        await user.save();

        // Generate JWT token
        const token = generateToken(user);

        // Set the token as a cookie and redirect
        res.cookie('token', token, { httpOnly: true }).redirect('/dashboard');
    } catch (err) {
        res.redirect('/auth?error=Registration failed');
        console.log(err)
    }
});

app.post('/login', async (req, res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({ email: email });
        if (!user) return res.redirect('/auth?error=User not found');

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.redirect('/auth?error=Invalid password');

        const token = generateToken(user);
        res.cookie('token', token, { httpOnly: true }).redirect('/dashboard');
    } catch (err) {
        res.redirect('/auth?error=auth failed');
        console.log(err);
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('token').redirect('/auth');
});




app.listen(port, (req, res) => {
    console.log(`Server is live on port 8000.  http://localhost:${port}`)
});