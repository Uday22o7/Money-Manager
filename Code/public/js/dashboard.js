document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const transactionData = {
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        accountId: document.getElementById('account').value
    };

    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(transactionData)
        });

        if (!response.ok) throw new Error('Transaction failed');

        // Refresh transactions list
        loadTransactions();
        resetForm();

    } catch (err) {
        alert(err.message);
    }
});

// Load transactions
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const transactions = await response.json();
        renderTransactions(transactions);

    } catch (err) {
        console.error('Error loading transactions:', err);
    }
}

// Render transactions
function renderTransactions(transactions) {
    const list = document.getElementById('transactionsList');
    list.innerHTML = transactions.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <span class="amount">$${transaction.amount}</span>
            <span class="category">${transaction.category}</span>
            <span class="date">${new Date(transaction.date).toLocaleDateString()}</span>
        </div>
    `).join('');
}