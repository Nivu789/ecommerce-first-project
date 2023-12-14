const crypto = require('crypto');

function generateRandomLink() {
    return crypto.randomBytes(6).toString('hex'); // Adjust the length as needed
}

module.exports = generateRandomLink