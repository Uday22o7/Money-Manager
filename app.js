const express = require("express");
const app = express();
const port = 8000;
const path = require('path')

const mongoose = require("mongoose");
// const db = "mongodb://127.0.0.1:27017/Money_Manager";

const ejsMate = require("ejs-mate")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
dotenv.config()
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require("./models/User")
const Transaction = require("./models/Transaction")
const Budget = require("./models/Budget");
const session = require('express-session');
const flash = require('connect-flash');

const mongoURI = process.env.MONGO_URI;
console.log(mongoURI)


// mongoose connection
mongoose.connect(mongoURI)
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


function isInPeriod(txDate, now, period) {
    switch (period) {
        case 'daily':
            return (
                txDate.getFullYear() === now.getFullYear() &&
                txDate.getMonth() === now.getMonth() &&
                txDate.getDate() === now.getDate()
            );
        case 'weekly':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            return txDate >= startOfWeek && txDate < endOfWeek;
        case 'monthly':
            return (
                txDate.getFullYear() === now.getFullYear() &&
                txDate.getMonth() === now.getMonth()
            );
        case 'yearly':
            return txDate.getFullYear() === now.getFullYear();
        case 'total':
            return true;
        default:
            return (
                txDate.getFullYear() === now.getFullYear() &&
                txDate.getMonth() === now.getMonth() &&
                txDate.getDate() === now.getDate()
            );
    }
}





// Routes

app.get("/", (req, res) => {
    res.render("./landingPage.ejs")
});

app.get("/auth", (req, res) => {
    res.render("./authPage.ejs")
});


app.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const period = req.query.period || 'daily'; // default to 'daily' if none provided
        const selectedCategory = req.query.category || null;

        const allTransactions = await Transaction.find({ user: req.user.id });
        const now = new Date();

        let filteredTransactions = [];
        let income = 0;
        let expense = 0;

        allTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const categoryMatch = !selectedCategory || tx.categories === selectedCategory;
            if (isInPeriod(txDate, now, period) && categoryMatch) {
                filteredTransactions.push(tx);
                if (tx.type === 'income') {
                    income += tx.amount;
                } else {
                    expense += tx.amount;
                }
            }
        });

        res.render('dashboard', {
            user: req.user,
            period,
            selectedCategory,
            transactions: filteredTransactions,
            income,
            expense,
            categories, // Pass categories to the view
            error: res.locals.error,
            success: res.locals.success
        });
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

app.get('/report', verifyToken, async (req, res) => {
    try {
        // 1. Existing monthly summary (keep your existing code)
        const monthlySummary = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    date: { $exists: true }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    income: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                        }
                    },
                    expense: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                        }
                    }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } }
        ]);

        // 2. Category breakdown for the first (category) pie chart
        const categoryAggregation = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id)
                }
            },
            {
                $group: {
                    _id: "$categories",
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { total: -1 } }
        ]);
        const categoryLabels = categoryAggregation.map(c => c._id);
        const categoryValues = categoryAggregation.map(c => c.total);

        // Fallback if no category data
        if (categoryLabels.length === 0) {
            categoryLabels.push("No Data");
            categoryValues.push(0);
        }

        // 3. Current month income vs. expense
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const currentMonthStats = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    date: { $exists: true },
                    // year/month must match the current year/month
                    $expr: {
                        $and: [
                            { $eq: [{ $year: "$date" }, currentYear] },
                            { $eq: [{ $month: "$date" }, currentMonth] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                        }
                    }
                }
            }
        ]);

        let monthlyIncomePie = 0;
        let monthlyExpensePie = 0;
        if (currentMonthStats.length > 0) {
            monthlyIncomePie = currentMonthStats[0].totalIncome;
            monthlyExpensePie = currentMonthStats[0].totalExpense;
        }

        // 4. Monthly labels
        const monthlyLabels = monthlySummary.map(m =>
            `${new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' })} ${m._id.year}`
        );

        // 5. NEW: Get budget data for bar chart
        const budgets = await Budget.find({
            user: req.user.id,
            type: 'monthly'
        });

        // Format budget data for charts
        const budgetCategories = budgets.map(b => b.category);
        const budgetTargets = budgets.map(b => b.target);
        const budgetActuals = budgets.map(b => b.current);

        // 6. Render the EJS view with budget data
        res.render('report', {
            user: req.user,
            monthlySummary,
            monthlyLabels,
            monthlyIncome: monthlySummary.map(m => m.income),
            monthlyExpenses: monthlySummary.map(m => m.expense),
            categoryLabels,
            categoryValues,
            monthlyIncomePie,
            monthlyExpensePie,
            // Add budget data
            budgetCategories,
            budgetTargets,
            budgetActuals,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error generating reports');
        res.redirect('/dashboard');
    }
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


// Budget page route
app.get('/budget', verifyToken, async (req, res) => {
    try {
        // Fetch all budgets for the current user
        const budgets = await Budget.find({ user: req.user.id });

        // For monthly budgets, check if we need to update any with actual spending
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // For each monthly budget, calculate current spending
        for (let budget of budgets) {
            if (budget.type === 'monthly') {
                // Get all expenses for this category in the current month
                const monthlyExpenses = await Transaction.aggregate([
                    {
                        $match: {
                            user: new mongoose.Types.ObjectId(req.user.id),
                            categories: budget.category,
                            type: 'expense',
                            date: { $exists: true },
                            $expr: {
                                $and: [
                                    { $eq: [{ $year: "$date" }, currentYear] },
                                    { $eq: [{ $month: "$date" }, currentMonth] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$amount" }
                        }
                    }
                ]);

                // Update the current spending amount
                budget.current = monthlyExpenses.length > 0 ? monthlyExpenses[0].total : 0;
                await budget.save();
            } else if (budget.type === 'custom') {
                // For custom date range budgets
                const customExpenses = await Transaction.aggregate([
                    {
                        $match: {
                            user: new mongoose.Types.ObjectId(req.user.id),
                            categories: budget.category,
                            type: 'expense',
                            date: {
                                $gte: budget.startDate,
                                $lte: budget.endDate
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$amount" }
                        }
                    }
                ]);

                // Update the current spending amount
                budget.current = customExpenses.length > 0 ? customExpenses[0].total : 0;
                await budget.save();
            }
        }

        res.render('budget', {
            user: req.user,
            budgets,
            categories,
            error: res.locals.error,
            success: res.locals.success
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading budget page');
        res.redirect('/dashboard');
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


// Create a new budget
app.post('/budget', verifyToken, async (req, res) => {
    try {
        const { type, category, target, startDate, endDate } = req.body;

        // Validate the request
        if (!type || !category || !target) {
            req.flash('error', 'Missing required fields');
            return res.redirect('/budget');
        }

        // For custom budgets, ensure dates are provided
        if (type === 'custom' && (!startDate || !endDate)) {
            req.flash('error', 'Start and end dates are required for custom budgets');
            return res.redirect('/budget');
        }

        // Check if a budget for this category already exists (for monthly budgets)
        if (type === 'monthly') {
            const existingBudget = await Budget.findOne({
                user: req.user.id,
                category: category,
                type: 'monthly'
            });

            if (existingBudget) {
                req.flash('error', 'A monthly budget for this category already exists');
                return res.redirect('/budget');
            }
        }

        // Create the new budget
        const budget = new Budget({
            user: req.user.id,
            type,
            category,
            target: parseFloat(target),
            current: 0, // Start with zero
            startDate: type === 'custom' ? new Date(startDate) : null,
            endDate: type === 'custom' ? new Date(endDate) : null
        });

        await budget.save();
        req.flash('success', 'Budget created successfully');
        res.redirect('/budget');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to create budget');
        res.redirect('/budget');
    }
});

// Delete a budget
app.post('/budget/:id/delete', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Delete only if budget belongs to the current user
        await Budget.deleteOne({ _id: id, user: req.user.id });
        req.flash('success', 'Budget deleted successfully');
        res.redirect('/budget');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to delete budget');
        res.redirect('/budget');
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