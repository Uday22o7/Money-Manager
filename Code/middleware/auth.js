const jwt = require('jsonwebtoken');

module.exports = {
    generateToken: (user) => {
        return jwt.sign({ id: user._id }, 'your-secret-key', { expiresIn: '1h' });
    },

    verifyToken: (req, res, next) => {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) return res.redirect('/login');

        jwt.verify(token, 'your-secret-key', (err, decoded) => {
            if (err) return res.redirect('/login');
            req.user = decoded;
            next();
        });
    }
};