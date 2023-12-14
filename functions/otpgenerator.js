// const crypto = require('crypto');

function generateOTP() {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

// const sixDigitOTP = generateOTP();
// console.log('Generated OTP:', sixDigitOTP);



module.exports = generateOTP;

