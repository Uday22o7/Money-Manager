const express = require("express");
const app = express();
const port = 8000;
const path = require('path')

const mongoose = require("mongoose");
const db = "mongodb://127.0.0.1:27017/Money_Manager"

const ejsMate = require("ejs-mate")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require("./models/User")
const Transaction = require("./models/Transaction")

const session = require('express-session');
const flash = require('connect-flash');

const mongoURI = process.env.MONGO_URI;
dotenv.config()

// mongoose connection
mongoose.connect(db)
    .then(() => {
        console.log('mongo Connection is successful');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });


app.use(require('cookie-parser')());
// Add session configuration before other middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize flash after session
app.use(flash());

// middleware
app.set('view engine', 'ejs')
app.engine('ejs', ejsMate)
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Add this middleware to make flash messages available in all views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});



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

app.get("/", (req, res) => {
    res.render("./landingPage.ejs")
});

app.get("/auth", (req, res) => {
    res.render("./authPage.ejs")
});

app.get('/dashboard', verifyToken, async (req, res) => {
    try {
        // Retrieve transactions that belong to the logged-in user
        const transactions = await Transaction.find({ user: req.user.id });
        // Pass transactions to the dashboard view along with user info
        res.render('./dashboard.ejs', { user: req.user, transactions });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching transactions');
        res.redirect('/dashboard?error=Error fetching transactions');
    }
});


app.get('/transactions', verifyToken, (req, res) => {
    res.render('./transaction.ejs', {
        user: req.user,
        categories: categories
    });
});

app.get('/transactions/:id/edit', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Find the transaction that belongs to the logged-in user
        const transaction = await Transaction.findOne({ _id: id, user: req.user.id });
        if (!transaction) {
            req.flash('error', 'Transaction not found');
            return res.redirect('/dashboard');
        }
        res.render('editTransaction', { user: req.user, transaction, categories });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching transaction for editing');
        res.redirect('/dashboard');
    }
});


app.post('/transactions', verifyToken, async (req, res) => {
    try {
        const { amount, account, type, categories } = req.body;
        // Add the user field from the decoded token
        const transaction = new Transaction({
            amount: amount,
            account: account,
            type: type,
            categories: categories,
            user: req.user.id  // <-- include the user relationship here
        });
        await transaction.save();
        req.flash('success', 'Transaction added successfully!');
        res.redirect('/transactions');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Failed to add transaction');
        res.redirect('/transactions?error=Transaction failed');
    }
});


app.post('/transactions/:id/edit', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, account, type, categories } = req.body;
        // Update the transaction if it belongs to the user
        await Transaction.findOneAndUpdate(
            { _id: id, user: req.user.id },
            { amount, account, type, categories },
            { new: true, runValidators: true }
        );
        req.flash('success', 'Transaction updated successfully!');
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to update transaction');
        res.redirect('/dashboard');
    }
});



// Delete a transaction (using POST route; you could also use DELETE if preferred)
app.post('/transactions/:id/delete', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Delete only if transaction belongs to the current user
        await Transaction.deleteOne({ _id: id, user: req.user.id });
        req.flash('success', 'Transaction deleted successfully!');
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to delete transaction');
        res.redirect('/dashboard');
    }
});



app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already registered');
            return res.redirect('/auth');
        }

        console.log(username, email, password)
        const user = new User({
            username: username,
            email: email,
            password: password // Schema will auto-hash
        });
        console.log(user)
        // Save the user to the database
        await user.save();

        // Generate JWT token
        const token = generateToken(user);

        req.flash('success', 'Registration successful!');
        // Set the token as a cookie and redirect
        res.cookie('token', token, { httpOnly: true }).redirect('/dashboard');
    } catch (err) {
        req.flash('error', 'Registration failed. Please try again.');
        res.redirect('/auth?error=Registration failed');
        console.log(err)
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            req.flash('error', 'Invalid username or Invalid password');
            return res.redirect('/auth?error=Invalid username or Invalid password');
        }

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            req.flash('error', 'Invalid username or Invalid password');
            return res.redirect('/auth?error=Invalid username or Invalid password');
        }

        const token = generateToken(user);
        req.flash('success', 'Login successful!');
        res.cookie('token', token, { httpOnly: true }).redirect('/dashboard');
    } catch (err) {
        res.redirect('/auth?error=auth failed');
        console.log(err);
    }
});

app.get('/logout', (req, res) => {
    req.flash('error', 'You have been logged out');
    res.clearCookie('token').redirect('/auth');
});




app.listen(port, (req, res) => {
    console.log(`Server is live on port 8000.  http://localhost:${port}`)
});