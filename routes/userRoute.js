const express = require('express');
const userRoute = express();
const path = require('path')
const userFunctions = require('../controllers/UserController')
const orderFuntions = require('../controllers/orderContoller')
const userAuth = require('../auth/userAuthentication')
const session = require('express-session')
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex'); 

userRoute.use(session({
    secret:secret,
    resave: true,
    saveUninitialized: true,
}))
const Razorpay = require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_kSIyK5TZxxovTs',
    key_secret: 'kAPTYiz3PlQiCPkwBxTgvg32',
  })
console.log("Secret key is "+secret)
userRoute.set('views','./views/user');

userRoute.get('/',userFunctions.getHome)
userRoute.post('/login',userFunctions.loadHome)

userRoute.get('/login',userAuth.isLogout,userFunctions.loadLogin)

userRoute.get('/register',userAuth.isLogout,userFunctions.loadRegister)
userRoute.post('/register',userFunctions.insertUser)

// userRoute.get('/home',userFunctions.getHome)

userRoute.get('/verifyotp',userAuth.isLogout,userFunctions.loadVerifyOtp)

// userRoute.get('/verifyotp',userAuth.isLogout,(req,res)=>{
//     res.render('otppage')
// })
userRoute.post('/verifyotp',userFunctions.verifyOtp)

userRoute.get('/forgotpassword',userAuth.isLogout,userFunctions.forgotPassword)

userRoute.post('/forgotpassword',userFunctions.sendForgotMail)

userRoute.post('/forgotpasswordotp',userFunctions.resetPassword)

// userRoute.get('/resetpassword',userFunctions.getResetPassword)

userRoute.post('/resetpassword',userFunctions.setPassword)

userRoute.get('/getdetails',userFunctions.getProductDetails)

userRoute.get('/resendotp',userAuth.isLogout,userFunctions.resendOtp)

userRoute.post('/loadotp',userFunctions.verifyResendOtp)
userRoute.get('/loadotp',userAuth.isLogout,userFunctions.loadOTP)

userRoute.get('/account',userAuth.isLogin,userFunctions.loadAccount)

userRoute.get('/cart',userAuth.isLogin,userFunctions.getCart)

userRoute.post('/addtocart',userAuth.isLogin,userFunctions.addToCart)

userRoute.get('/removefromcart',userAuth.isLogin,userFunctions.removeCartItem)

userRoute.get('/checkout',userAuth.isLogin,userFunctions.getCheckoutProducts)

userRoute.post('/placeorder',userAuth.isLogin,orderFuntions.placeOrder)

userRoute.get('/addaddress',userAuth.isLogin,userFunctions.addAddress)

userRoute.post('/addaddress',userFunctions.commitAddAddress)

userRoute.get('/editaddress',userAuth.isLogin,userFunctions.editAddress)

userRoute.post('/editaddress',userFunctions.commitEditAddress)

userRoute.get('/deleteaddress',userFunctions.deleteAddress)

userRoute.post('/update-quantity/:quantity/:index',userFunctions.updateQuantity)

userRoute.get('/logout',userAuth.isLogin,userFunctions.logoutUser)

userRoute.get('/orderdetails',userAuth.isLogin,userFunctions.getOrderDetails)

userRoute.post('/cancelorder',userAuth.isLogin,orderFuntions.cancelOrder)

userRoute.post('/updateinfo',userAuth.isLogin,userFunctions.updateInfo)

userRoute.get('/clearallcart',userFunctions.clearAllCart)

userRoute.post('/onlinepayment',(req,res)=>{
  console.log(req.body.amount)
    console.log('hadsfhsdfak');
    var options = {
        
        amount: req.body.amount*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
      };
      
      instance.orders.create(options, function(err, order) {
        console.log(order);
        let razorOrderId = order;
        let paymentStatus = order.status
        console.log("RazorODER",razorOrderId)
        res.status(200).json({ message: "Order placed successfully.", razorOrderId ,paymentStatus});
      });
      
})

userRoute.post('/editaddresscheckout',userAuth.isLogin,userFunctions.commitEditAddressFromCheckout)

userRoute.get('/product-results',userFunctions.getProductResults)

userRoute.get('/editaddresscheckout',userAuth.isLogin,userFunctions.editAddressFromCheckout)

userRoute.get('/filterbyasc',userFunctions.filterByAscending)

userRoute.get('/filterbydsc',userFunctions.filterByDescending)

userRoute.post('/applycoupon',userFunctions.applyCoupon)

userRoute.post('/paybywallet',userFunctions.payByWallet)

userRoute.post('/applyreferral',userFunctions.applyReferral)

userRoute.get('/wishlist',userAuth.isLogin,userFunctions.getWishlist)

userRoute.post('/add-to-wishlist',userAuth.isLogin,userFunctions.addToWishlist)

userRoute.post('/add-to-cart-from-wishlist',userAuth.isLogin,userFunctions.addToCartFromWishlist)

userRoute.post('/remove-from-wishlist',userFunctions.removeFromWishlist)

userRoute.post('/submit-review',userFunctions.submitProductReview)

userRoute.post('/reply-to-review',userAuth.isLogin,userFunctions.postReviewReply)

userRoute.get('/view-all-products',userFunctions.getAllProducts)



module.exports = userRoute;