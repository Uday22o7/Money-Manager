const mongoose = require('mongoose');


const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['monthly', 'custom'],
        default: 'monthly'
    },
    category: String,
    target: {
        type: Number,
        required: true
    },
    current: {
        type: Number,
        default: 0
    },
    startDate: Date,
    endDate: Date
}, { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);