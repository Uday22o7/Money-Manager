const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  currency: { type: String, default: 'USD' },
  categories: [{
    name: String,
    type: { type: String, enum: ['income', 'expense'] }
  }],
  accounts: [{
    name: String,
    type: { type: String, enum: ['cash', 'bank', 'credit'] },
    balance: { type: Number, default: 0 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);