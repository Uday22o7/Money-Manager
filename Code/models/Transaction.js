// models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // Ensure this type definition
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    account: {
        type: String,
        enum: ['cash', 'bank', 'credit'] ,
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    categories: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);