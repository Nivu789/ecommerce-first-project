const User = require('../models/UserModel')
const Swal = require('sweetalert2')
const express = require('express')
const app = express();
const nodemailer = require('nodemailer')
const generateOTP = require('../functions/otpgenerator')
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel')
const Razorpay = require('razorpay')
const Coupon = require('../models/couponModel')
const cron = require('node-cron');
const randomstring = require('randomstring');
require('dotenv').config();
const Wishlist = require('../models/wishlistModel');
const offerExpiry = require('../functions/offerExpiry')
const Banner = require('../models/bannerModel')
const Brand = require('../models/brandModel')
const bcrypt = require('bcrypt')

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  })

// cron.schedule('* * * * * *', () => {
//             // console.log('Cron job running every minute!');
//             // Add your task logic here
//             const randomString = randomstring.generate(5);
//             const randomNumber = Math.floor(100 + Math.random() * 900).toString();
//             console.log('Random String:', randomString+randomNumber);

//         });




const loadLogin = (req,res) =>{
    try {
        res.render('login',{message:''})
    } catch (error) {
        console.log(error)
    }
}

const getHome = async(req,res) =>{
    try {
        // res.redirect('/home')
        const product = await Product.find({is_active:true}).populate('categoryid')
        const category = await Category.find({is_active:true})
        const userData = await User.findOne({email:req.session.email}).populate('cart.productId')
        const bannerData = await Banner.find({})
        const brandData = await Brand.find({})
        console.log(req.session.email);
        if(userData){
            console.log(userData);
            const userId = userData._id
            const wishListData = await Wishlist.findOne({userId:userId}).populate('products.productId')
            console.log(wishListData)
            res.render('home',{product,category,userData,wishListData,bannerData,brandData})
        }else{
            console.log('fas');
            res.render('home',{product,category,userData,bannerData,brandData})
        }
        
        
    } catch (error) {
        console.log(error)
    }
}

  const loadHome = async(req,res) =>{
    try {
        const email = req.session.email||req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email});
        
        if(userData){
            if(userData.is_verified==true){
                if(userData.is_active==true){
                    const passwordMatch = await bcrypt.compare(password, userData.password);
                    if(passwordMatch){
                        const product = await Product.find({is_active:true})
                        const category = await Category.find({is_active:true})
                        req.session.email = userData.email
                        req.session.activeUser = true;
                        res.redirect('/')
                    }else{
                        res.render('login',{message:"Email and password mismatch"})
                    }
                }else{
                    
                    res.render('login',{message:"You were blocked by the admin"})
                }
                
            }else{
                res.render('login',{message:"You are not verified"})
            }     
        }else{
            res.render('login',{message:"No such user found"})
        }

    } catch (error) {
        console.log(error)
    }
}

const loadRegister = (req,res) =>{
    try {
        res.render('register',{message:''})
    } catch (error) {
        console.log(error)
    }
}

const insertUser = async(req,res) =>{
    try {
        console.log("Wroking")
        const email = req.body.email;
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        const name = req.body.name;
        const phone = req.body.phone;
        console.log(password,cpassword)
        const emailData = await User.countDocuments({email:email})
        if(emailData>0){
            res.render('register',{message:'0'})
        }else if(password!==cpassword){
            res.render('register',{message:"1"})
        }else if (/^\s|\s$/.test(name)||/^\s|\s$/.test(phone)||/^\s|\s$/.test(password)||/^[789]\d{10}$/.test(phone)) {
                console.log("white")
                res.render('register', { message: "2"})
        }else if(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)!=true){
            res.render('register',{message:'3'});
            console.log("PAssword validation")
        }
        else{
            
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                  user: 'nivuyt789@gmail.com', // your Gmail email address
                  pass: 'qyzi chtu yqkj dpmf' // your Gmail email password or an App Password
                }
              });
              
              
              const otp = generateOTP();
              
              
              const mailOptions = {
                from: 'nivuyt789@gmail.com', // your email address
                to: req.body.email, // recipient's email address
                subject: 'Hello, World!', // email subject
                text: 'This is the plain text message.',
                html: `Your verification code is:${otp}`
              };
            
            
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.log('Error sending email: ' + error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });

              const randomString = randomstring.generate(5);
            const randomNumber = Math.floor(100 + Math.random() * 900).toString();
            const referelCode = randomString+randomNumber
            
            let amountAddedInWallet;
            if(req.session.referralAmount){
                amountAddedInWallet = req.session.referralAmount
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password,salt)
            const userData = {
                name:req.body.name,
                email:req.body.email,
                phone:req.body.phone,
                password:hashedPassword,
                is_admin:0,
                is_active:true,
                is_verified:true,
                ref_code:referelCode,
                wallet:amountAddedInWallet
            }
            req.session.otpTime = Date.now();
            req.session.data = userData
            req.session.otp = otp
            console.log(otp)
           
            res.redirect('/verifyotp')
        }
        
    } catch (error) {
        console.log(error)
    }
}

const loadVerifyOtp = async(req,res) =>{
    
    try {
        res.render('otppage')
        console.log(req.session.otp)

    } catch (error) {
       console.log(error) 
    }
}


const verifyOtp = async(req,res) =>{
    try {
        
        const userOtp = req.body.otp;
        console.log("User OTP "+userOtp)
        
        const timeLimit = Date.now();
        if(timeLimit-req.session.otpTime >30000){
            res.render('otppage',{message:"OTP expired"})
        }else if(userOtp!==req.session.otp){
            res.render('otppage',{message:"Invalid OTP"})
        }else{
            console.log("User should be inserted")
                const {name,email,phone,password,is_admin,is_active,is_verified,ref_code,wallet} = req.session.data;
                  const user = await new User({
                    name:name,
                    email:email,
                    phone:phone,
                    password:password,
                    is_admin:is_admin,
                    is_active:is_active,
                    is_verified:is_verified,
                    ref_code:ref_code,
                    wallet:wallet
                  })
    
                  const userData = await user.save();
                  if(userData){
                    await User.findOneAndUpdate({ref_code:req.session.referralCode},{$inc:{wallet:+500}})
                    delete req.session.referralAmount
                    delete req.session.referralCode
                    await req.session.save();
                    res.redirect('/')
                  }
        }
        
        
 
}catch(error){
    console.log(error)
}

}

const forgotPassword = async(req,res) =>{
    try {
        res.render('forgotpass')
    } catch (error) {
        console.log(error)
    }
}

const sendForgotMail = async(req,res) =>{
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'nivuyt789@gmail.com', // your Gmail email address
              pass: 'qyzi chtu yqkj dpmf' // your Gmail email password or an App Password
            }
          });

        const otp = generateOTP();

        const mailOptions = {
            from: 'nivuyt789@gmail.com', // your email address
            to: req.body.email, // recipient's email address
            subject: 'Hello, World!', // email subject
            text: 'This is the plain text message.',
            html: `Your verification code is:${otp}`
          };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('Error sending email: ' + error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        
        // const email = req.body.email
        req.session.email = req.body.email;
        req.session.otp = otp;
        // await User.findOneAndUpdate({email:email},{$set:{otp:otp}})
        
        res.render('forgotpassotp')
        
          
    } catch (error) {
        console.log(error)
    }
}



const resetPassword = async(req,res)=>{
    try {
        // const email = req.body.email;
        // console.log(email)
        const userOtp = req.body.otp;
        // const userData = await User.findOne({otp:userOtp})
        if(userOtp==req.session.otp){
            res.render('resetpassword')
        }else{
            res.render('forgotpassotp',{message:"Invalid OTP"})
        }
    } catch (error) {
        console.log(error)
    }
}



const setPassword = async(req,res) =>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        if(password!=cpassword){
            res.render('resetpassword',{message:"Password didn't match"})
        }else{
            // await User.findOneAndUpdate({email:email},{$set:{otp:null}})
            const hashedPassword = await bcrypt.hash(password,10)
            const userData = await User.findOneAndUpdate({email:req.session.email},{$set:{password:hashedPassword}});
        if(userData){
            res.redirect('/')
        }else{
            res.render('resetpassword',{message:"Failed"})
        }
        }
        
    } catch (error) {
        console.log(error)
    }
}


const getProductDetails = async(req,res) =>{
    try {
        // cron.schedule('* * * * * *', () => {
        //     console.log('Cron job running every minute!');
        //     // Add your task logic here
        // });
        const id = req.query.id;
        
        const email = req.session.email
        const productData = await Product.findOne({_id:id}).populate('brand')
        const userData = await User.findOne({email:email})
        const fullProductData = await Product.find({})
        if(userData){
            const userId = userData._id;
            const wishListData = await Wishlist.findOne({userId:userId})
            if(productData){
                res.render('product-details',{productData,userData,fullProductData,wishListData})
            }
        }else{
            res.render('product-details',{productData,fullProductData})
        }
        // const userId = userData._id
        
    } catch (error) {
        console.log(error)
    }
}


const loadOTP = async(req,res)=>{
    try {
        res.render('otppage')
        
    } catch (error) {
        console.log(error.message);
    }
}


const resendOtp = async(req,res) =>{
    try {
        
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'nivuyt789@gmail.com', // your Gmail email address
              pass: 'qyzi chtu yqkj dpmf' // your Gmail email password or an App Password
            }
          });
          
          
          const otp = generateOTP();
          
          
          const mailOptions = {
            from: 'nivuyt789@gmail.com', // your email address
            to: req.session.data.email, // recipient's email address
            subject: 'Hello, World!', // email subject
            text: 'This is the plain text message.',
            html: `Your New verification code is:${otp}`
          };
        
        
          
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('Error sending email: ' + error);
            } else {
              console.log('Email sent: ' + info.response);
             
            }
          });

          
        req.session.resentOtpTime = Date.now();
        req.session.newotp = otp;
        console.log(otp)
        res.redirect('/loadotp')
          
    } catch (error) {
        console.log(error)
    }
}


const verifyResendOtp = async(req,res) =>{
    try {
        const userOtp = req.body.otp;
        const timeLimit = Date.now();
        if(timeLimit-req.session.resentOtpTime >30000){
            res.render('otppage',{message:"OTP Expired"})
        }else if(userOtp!==req.session.newotp){
            res.render('otppage',{message:"Invalid OTP"})
        }else{
            console.log("User should be inserted")
                const {name,email,phone,password,is_admin,is_active,is_verified} = req.session.data;
                  const user = await new User({
                    name:name,
                    email:email,
                    phone:phone,
                    password:password,
                    is_admin:is_admin,
                    is_active:is_active,
                    is_verified:is_verified
                  })
    
                  const userData = await user.save();
                  if(userData){
                    res.redirect('/')
                    delete req.session.email;
                  }
        }
        
        
    } catch (error) {
        console.log(error)
    }
}

const loadAccount = async(req,res) =>{
    try {
        // const userData = await User.findOne({email:req.session.email})
        // console.log(req.session.email)
        // console.log(userData)
        const userData = await User.findOne({_id:req.query.id})
        const orderData = await Order.find({userId:userData._id}).populate('products.productId').sort({orderDate:-1})
        const userId = userData._id
        const wishListData = await Wishlist.findOne({userId:userId})
    //    console.log(orderData)
        if(userData){
            res.render(`account`,{userData,orderData,wishListData})
        }
    } catch (error) {
        console.log(error)
    }
}

const getOrderDetails = async(req,res) =>{
    try {
        console.log("Handling getOrderDetails request");
        const orderId = req.query.orderid;
        console.log(orderId)
        const userData = await User.findOne({email:req.session.email})
        const userId = userData._id
        const wishListData = await Wishlist.findOne({userId:userId})
        const orderDetails = await Order.findOne({_id:orderId}).populate('products.productId');
        const category = await Category.find({is_active:true})
            res.render('orderdetails',{orderDetails,userData,category,wishListData})
        
        
    } catch (error) {
        console.log(error)
    }
}

const getCart = async(req,res) =>{
    try {

        // const id = req.session.userId;
        const email = req.session.email;
        const userData = await User.findOne({email:email});
        const userId = userData._id
        const wishListData = await Wishlist.findOne({userId:userId})
        if(userData){
            const fullUserData = await User.findOne({email:email}).populate('cart.productId')
            
            // console.log(fullUserData)
            res.render('cart',{userData,fullUserData,wishListData})
        }else{
            res.redirect('/');
        }
        // const id = req.query.userId;
        // const productId = req.query.productId
        // const userData = await User.findOne({_id:id});
        // const productData = await Product.findOne({_id:productId})
        // await User.findByIdAndUpdate({_id:id},{$push:{cart:productData}});
        // res.render('cart',{userData,productData})
    } catch (error) {
        console.log(error)
    }
}

const addToCart = async(req,res) =>{
    try {
        const email = req.session.email;
        const productId = req.query.productId
        const quantity = req.body.quantity||req.query.quantity;
        console.log("QUANTITY",quantity)
        const cartItem = {
            productId:productId,
            quantity:quantity
        }
        const userData = await User.findOne({email:email});
        // const productData = await Product.findOne({_id:productId})
        const existingCartItemIndex = userData.cart.findIndex(item => item.productId == productId);
        // console.log(existingCartItemIndex)
        if (existingCartItemIndex !== -1) {
            // Product already exists in the cart, update the quantity
            // userData.cart[existingCartItemIndex].quantity += parseInt(quantity, 10);
            // console.log("Quantity increased")
            await User.updateOne(
                { email: email, 'cart.productId': productId },
                { $set: { 'cart.$.quantity': userData.cart[existingCartItemIndex].quantity + parseInt(quantity, 10) } }
            );
            res.redirect('/cart')
        } else {
            await User.findOneAndUpdate({email:email},{$push:{cart:cartItem}});
            res.redirect('/cart')
        }
        // if(userData){
        //     // await User.findOneAndUpdate({email:email},{$push:{cart:cartItem}});
        //     // res.redirect('/cart')
        // }else{
        //     console.log("Login")
        // }
        
    } catch (error) {
        console.log(error)
    }
}

const removeCartItem = async(req,res) =>{
    try {
        const itemId = req.query.itemId;
        console.log(itemId)
        const email = req.session.email;
        await User.findOneAndUpdate(
            { email: email },
            { $pull: { cart: { _id: itemId } } },
            { new: true } // Set to true to return the modified document after update
        );
        res.redirect('/cart');
    } catch (error) {
        console.log(error.message);
    }
}

const getWishlist = async(req,res) =>{
    try {
        const email = req.session.email;
        const userData = await User.findOne({email:email})
        const userId = userData._id
        const wishListData = await Wishlist.findOne({userId:userId}).populate('products.productId')
        const productData = await Product.find({})
        // console.log(wishListData)
        res.render('wishlist',{wishListData,productData,message:'',userData})
    } catch (error) {
        console.log(error)
    }
}

const addToWishlist = async(req,res) =>{
    try {
        console.log(req.body)
        const products = {
            productId:req.body.productId,
            quantity:req.body.quantity
        }
        const productExist = await Wishlist.findOne({userId: req.body.userId,
            products: {
                $elemMatch: { productId: req.body.productId }
            }})
        console.log("Product Exist",productExist)
        if(productExist){
            res.json({message:"Exist"})
        }else{
            const wishListExist = await Wishlist.findOne({userId:req.body.userId})
            if(wishListExist){
                await Wishlist.findOneAndUpdate({userId:req.body.userId},{$push:{products:products}})
            }else{
                const wishlist = await new Wishlist({
                userId:req.body.userId,
                products:products
            })
            await wishlist.save();
        }

        res.json({message:"Added"})
        }
       
    } catch (error) {
        console.log(error)
    }
}

const addToCartFromWishlist = async(req,res) =>{
    try {
        const email = req.session.email
        const productId = req.query.id;
        const userData = await User.findOne({email:email});
        const userId = userData._id
        const quantity = 1;
        console.log("PRODUCT ID",productId)
        const wishListData = await Wishlist.findOne({userId:userId}).populate('products.productId')
        const cartItem = {
            productId:productId,
            quantity:1
        }
        
        
        const productExist = userData.cart.findIndex(item=>item.productId == productId)
            if(productExist!==-1){
                console.log("Exist")
                res.render('wishlist',{wishListData,message:'1'})
            }else{
                // const productData = await Product.findOne({_id:productId})
        const existingCartItemIndex = userData.cart.findIndex(item => item.productId == productId);
        // console.log(existingCartItemIndex)
        if (existingCartItemIndex !== -1) {
            // Product already exists in the cart, update the quantity
            // userData.cart[existingCartItemIndex].quantity += parseInt(quantity, 10);
            // console.log("Quantity increased")
            await User.updateOne(
                { email: email, 'cart.productId': productId },
                { $set: { 'cart.$.quantity': userData.cart[existingCartItemIndex].quantity + parseInt(quantity, 10) } }
            );
            res.redirect('/cart')
        } else {
            await User.findOneAndUpdate({email:email},{$push:{cart:cartItem}});
            res.redirect('/cart')
        }
            }
        
        

    } catch (error) {
        console.log(error)
    }
}


const removeFromWishlist = async(req,res) =>{
    try {
        console.log(req.body)
        const userData = await User.findOne({email:req.session.email})
        const userId = userData._id;
        await Wishlist.findOneAndUpdate({userId:userId},{$pull:{products:{productId:req.body.productId}}})
        res.redirect(`/wishlist?id=${userId}`)
    } catch (error) {
        console.log(error)
    }
}

const getCheckoutProducts = async(req,res) =>{
    try {
        const email = req.session.email;
        const userData = await User.findOne({email:email});
        const totalAmount = req.session.totalAmount
        const userId = userData._id
        const wishListData = await Wishlist.findOne({userId:userId})
        console.log(totalAmount)
        const currentDate = Date.now();
        if(userData){
            const fullUserData = await User.findOne({email:email}).populate('cart.productId')
            // const couponData = await Coupon.find({
            //     redeemedUsers: {
            //       $not: {
            //         $elemMatch: { $eq: userData._id }
            //       }
            //     }
            //   });
            let totalAmount = 0;
            for (const cartItem of fullUserData.cart) {
                const productPrice = cartItem.productId.salePrice; // Assuming price is a property of the product model
                const quantity = cartItem.quantity;
                totalAmount += productPrice * quantity;
            }
            console.log(totalAmount)

            const couponData = await Coupon.find({
                $and:[
                    {redeemedUsers: { $nin: [userData._id] }},
                    {expiryDate: { $gte: currentDate }},
                    {minPurchase:{$lte:totalAmount}}
                ]   
              });
              console.log(couponData)
            console.log(fullUserData)
            res.render('shop-checkout',{userData,fullUserData,couponData,wishListData})
        }else{
            res.redirect('/');
        }
    } catch (error) {
        console.log(error)
    }
}

const applyCoupon = async(req,res) =>{
    try {
        console.log(parseInt(req.body.totalPrice))
        console.log(req.body.couponCode)
        const couponCode = req.body.couponCode
        const totalPrice = parseInt(req.body.totalPrice);
        const couponData = await Coupon.findOne({couponcode:couponCode});
        const userData = await User.findOne({email:req.session.email});
        const userId = userData._id;
        // const query = { "redeemedUsers": { $in: [userId] } };
        // const userPresent = await Coupon.findOne(query);
        const userPresent = await Coupon.findOne({
            couponcode: couponCode,
            redeemedUsers: { $in: [userId] }
          });
          console.log(userPresent)
        if(userPresent){
            res.json({status:"failed"})
        }else{
            
            if(couponData){
                if(couponData.discount>0){
                    const newAmount = totalPrice-couponData.discount
                    console.log(newAmount)
                    // await Coupon.findOneAndUpdate({couponcode:couponCode},{$push:{redeemedUsers:userId}})
                    res.json({newAmount:newAmount,couponcode:couponCode,discount:couponData.discount}) 
                }else{
                    const offerPercentage = couponData.offerPercentage;
                    const amountToDeduce = totalPrice * (offerPercentage/100)
                    const newAmount = totalPrice - amountToDeduce
                    res.json({newAmount:newAmount,couponcode:couponCode,discount:amountToDeduce}) 
                }
            
            }else{
                res.json({status:"failed"})
            }
            
        }
      
    } catch (error) {
        console.log(error)
    }
}

// const placeOrder = async(req,res) =>{
//     try {
//         const email = req.session.email;
//         const userData = await User.findOne({email:email})
//         if(userData){
//             await User.updateOne({ email: email }, { $set: { cart: [] } });
//             res.redirect(`/account?id=${userData._id}`)
//         }
        
//     } catch (error) {
//         console.log(error)
//     }
// }

const addAddress = async(req,res) =>{
    try {
        res.render('addaddress')
    } catch (error) {
        console.log(error)
    }
}

const commitAddAddress = async(req,res) =>{
    try {
        const addressData = {
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            a1:req.body.addressline1,
            a2:req.body.addressline2,
            city:req.body.city,
            state:req.body.state,
            postcode:req.body.postcode,
            phone:req.body.phone,
            email:req.body.email
        }
        const email = req.session.email;
        console.log(email)
        const userData = await User.findOneAndUpdate({email:email},{$push:{address:addressData}});
        if(userData){
            res.redirect(`/account?id=${userData._id}`)
        }else{
            console.log("Error")
        }
    } catch (error) {
        console.log(error)
    }
}

const editAddress = async(req,res) =>{
    try {
        const email = req.session.email;
        const userData = await User.findOne({email:email});
        const addressId = req.query.id;
        console.log(addressId)
        const selectedAddress = userData.address.find(address => address._id == addressId);
        if(userData){
              res.render('editaddress',{userData,selectedAddress})
        }else{
            res.redirect('/account')
        }
    } catch (error) {
        console.log(error)
    }
}

const commitEditAddress = async(req,res) =>{
    try {
        const updatedData = {
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            a1:req.body.addressline1,
            a2:req.body.addressline2,
            city:req.body.city,
            state:req.body.state,
            postcode:req.body.postcode,
            phone:req.body.phone,
            email:req.body.email
        }
        const email = req.session.email;
        const addressId = req.query.id;
        console.log(addressId)
        // const userData = await User.findOneAndUpdate({email:email,"address._id": addressId},{$set:{address:{firstname:updatedData.firstname,lastname:updatedData.lastname,a1:updatedData.a1,
        // a2:updatedData.a2,city:updatedData.city,state:updatedData.state,postcode:updatedData.postcode,phone:updatedData.phone}}});
        const userData = await User.findOneAndUpdate(
            { email: email, "address._id": addressId }, // Find the user by email and match the specific address ID
            {
                $set: {
                    "address.$.firstname": updatedData.firstname,
                    "address.$.lastname": updatedData.lastname,
                    "address.$.a1": updatedData.a1,
                    "address.$.a2": updatedData.a2,
                    "address.$.city": updatedData.city,
                    "address.$.state": updatedData.state,
                    "address.$.postcode": updatedData.postcode,
                    "address.$.phone": updatedData.phone
                }
            },
            { new: true } // To return the modified document instead of the original
        );
        if(userData){
            res.redirect(`/account?id=${userData._id}`)
        }else{
            console.log("Error")
        }
    } catch (error) {
        console.log(error)
    }
}

const deleteAddress = async(req,res) =>{
    try {
        const addressId = req.query.id;
        console.log(addressId)
        const email = req.session.email;
        const userData = await User.findOneAndUpdate(
            {email:email},{$pull:{address:{_id:addressId}}},

        )
        if(userData){
            res.redirect(`/account?id=${userData._id}`)
        }
    } catch (error) {
        console.log(error)
    }
}

const editAddressFromCheckout = async(req,res) =>{
    try {
        const id = req.query.id;
        console.log(id)
        const userData = await User.findOne({email:req.session.email});
        const selectedAddress = await userData.address.find(address => address._id == id);
        console.log(selectedAddress)
        if(userData){
            res.render('editaddressfromcheckout',{userData,selectedAddress})
        }else{
            res.redirect('/checkout')
        }
    } catch (error) {
        console.log(error)
    }
}

const commitEditAddressFromCheckout = async(req,res) =>{
    try {
        const updatedData = {
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            a1:req.body.addressline1,
            a2:req.body.addressline2,
            city:req.body.city,
            state:req.body.state,
            postcode:req.body.postcode,
            phone:req.body.phone,
            email:req.body.email
        }
        const email = req.session.email;
        const addressId = req.query.id;
        console.log(addressId)
        // const userData = await User.findOneAndUpdate({email:email,"address._id": addressId},{$set:{address:{firstname:updatedData.firstname,lastname:updatedData.lastname,a1:updatedData.a1,
        // a2:updatedData.a2,city:updatedData.city,state:updatedData.state,postcode:updatedData.postcode,phone:updatedData.phone}}});
        const userData = await User.findOneAndUpdate(
            { email: email, "address._id": addressId }, // Find the user by email and match the specific address ID
            {
                $set: {
                    "address.$.firstname": updatedData.firstname,
                    "address.$.lastname": updatedData.lastname,
                    "address.$.a1": updatedData.a1,
                    "address.$.a2": updatedData.a2,
                    "address.$.city": updatedData.city,
                    "address.$.state": updatedData.state,
                    "address.$.postcode": updatedData.postcode,
                    "address.$.phone": updatedData.phone
                }
            },
            { new: true } // To return the modified document instead of the original
        );
        if(userData){
            res.redirect(`/checkout`)
        }else{
            console.log("Error")
        }
    } catch (error) {
        console.log(error)
    }
}


const updateQuantity = async(req,res) =>{
    try {
        const quantity = req.params.quantity;
        const index = req.params.index;
        console.log(quantity,index)
        const updatedCart = await User.findOne({email:req.session.email}).populate('cart.productId');
        updatedCart.cart[index].quantity = quantity;
        await updatedCart.save();
        res.json(updatedCart);
    } catch (error) {
        console.log(error)
    }
}

const logoutUser = async(req,res) =>{
    try {
        
        if(req.session.activeUser){
            delete req.session.activeUser
            delete req.session.email
            await req.session.save()
            res.redirect('/');
        }
 
    } catch (error) {
        console.log(error)
    }
}

const updateInfo = async(req,res) =>{
    try {
        console.log("HELLO")
        const sessionEmail = req.session.email;
        const userData = await User.findOne({email:sessionEmail})
        const name = req.body.name;
        const email = req.body.email;
        const currentpassword = req.body.currentpassword;
        const newpassword = req.body.newpassword;
        const confirmpassword = req.body.confirmpassword;
        const errors = []; 
        
        if(currentpassword.length!==0){
            if(currentpassword!==userData.password){
                errors.push("Wrong Password")
            }
        }
       
        if(newpassword!==confirmpassword){
            errors.push("Passwords didn't match")
        }
        console.log(errors)
        if (errors.length === 0) {
            // If no errors, consider it a 
            req.session.email = email
            res.json({ success: true });
            if(newpassword.length>0){
               
            
                await User.findOneAndUpdate({email:sessionEmail},{$set:{name:name,email:email,password:newpassword}})
                
            }else{
               
                await User.findOneAndUpdate({email:sessionEmail},{$set:{name:name,email:email}})
                
            }
           
            // res.redirect(`/account?id=${userData._id}`)
          } else {
            // If there are errors, respond with error messages
            res.status(400).json({ success: false, errors });
          }
        // res.redirect(`/account?id=${userData._id}`)
    } catch (error) {
        console.log(error)
    }
}

const clearAllCart = async(req,res) =>{
    try {
        const email = req.session.email;
        const userData = await User.findOneAndUpdate({email:email},{$set:{cart:[]}});
        if(userData){
            res.redirect('/cart')
        }
    } catch (error) {
        console.log(error)
    }
}

const getProductResults = async(req,res) =>{
    try {
        console.log(req.query.search)
        const categoryData = await Category.find({})
        var search = '';
        var page = req.query.page||1;
        var limit = 5;
        var filter = req.query.filter||'';
        if(req.query.search||req.query.page&&filter==''){
            search = req.query.search;
            page = req.query.page;
            console.log("Search is",search)
            // const productData = await Product.find({$or:[{productName:{$regex:'.*'+search+'.*'}},{categoryName:{$regex:search}}]}).populate('categoryid')
            const productData = await Product.find({
                $or: [
                    { productName: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                    { categoryid: { $in: await getCategoryIdsByCategoryName(search) } },
                    { brand: { $in: await getCategoryIdsByBrandName(search) } }
                ]
            }).populate('categoryid').limit(limit)
            .skip((page-1)*limit)
            
            console.log(productData)

            async function getCategoryIdsByCategoryName(categoryName) {
                const regexPattern = new RegExp('.*' + categoryName.replace(/ /g, '.*') + '.*', 'i');
                console.log('Regex Pattern:', regexPattern);
                const category = await Category.findOne({ categoryName: { $regex: regexPattern } });
                console.log(category)
                return category ? [category._id] : [];
            }

            async function getCategoryIdsByBrandName(brandName) {
                const regexPattern = new RegExp('.*' + brandName.replace(/ /g, '.*') + '.*', 'i');
                console.log('Regex Pattern:', regexPattern);
                const brand = await Brand.findOne({ brandName: { $regex: regexPattern } });
                console.log(brand)
                return brand? [brand._id] : [];
            }

            const count = await Product.find({
                $or: [
                    { productName: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                    { categoryid: { $in: await getCategoryIdsByCategoryName(search) } }
                ]
            }).countDocuments();

            const totalPages = Math.ceil(count/limit);
            // console.log(productData)
            res.render('product-results',{productData,totalPages,search,page,filter:'',categoryData})
        }

    } catch (error) {
        console.log(error)
    }
}

const filterByAscending = async(req,res) =>{
    try {
        var search = req.query.search
        const categoryData = await Category.find({})
        var limit = 5;
        var page = req.query.page||1;
        console.log("PAge is",req.query.page)
        console.log("sEarch is",req.query.search)
        if(req.query.search||req.query.page){
            console.log("SEarch from bottom",req.query.search)
            const productData = await Product.find({
                $or:[
                    {productName:{$regex: new RegExp('.*'+search+'.*','i')}},
                    {categoryid:{$in:await getCategoryIdsByCategoryName(search)}}
                ]
            }).sort({salePrice:1}).limit(limit).skip((page-1)*limit)
            
            console.log("Product Data is",productData)
            async function getCategoryIdsByCategoryName(categoryName) {
                const regexPattern = new RegExp('.*' + categoryName.replace(/ /g, '.*') + '.*', 'i');
                // console.log('Regex Pattern:', regexPattern);
                const category = await Category.findOne({ categoryName: { $regex: regexPattern } });
                console.log("Category is",category)
                return category ? [category._id] : [];
            }

            const count = await Product.find({
                $or: [
                    { productName: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                    { categoryid: { $in: await getCategoryIdsByCategoryName(search) } }
                ]
            }).countDocuments();

            console.log("Count is",count)

            const totalPages = Math.ceil(count/limit);
            console.log(productData)
            res.render('product-results',{productData,totalPages,search,page,filter:'lth',categoryData})
        }
    } catch (error) {
        console.log(error)
    }
}

const filterByDescending = async(req,res) =>{
    try {
        var search = req.query.search;
        var limit = 5;
        var page = req.query.page || 1;
        console.log("Page is",page)
        const categoryData = await Category.find({})
        const productData = await Product.find({
            $or:[
                {productName:{$regex:new RegExp('.*'+search+'.*')}},
                {categoryid:{$in: await getCategoryIdsByCategoryName(search)}}
            ]
        }).sort({salePrice:-1}).limit(limit).skip((page-1)*limit)

        console.log("Product Data is",productData)
        async function getCategoryIdsByCategoryName(categoryName){
            const regexPattern = new RegExp('.*' + categoryName.replace(/ /g, '.*') + '.*', 'i');
            // console.log('Regex Pattern:', regexPattern);
            const category = await Category.findOne({ categoryName: { $regex: regexPattern } });
            return category?[category._id]:[]
        }

        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                { categoryid: { $in: await getCategoryIdsByCategoryName(search) } }
            ]
        }).countDocuments();

        console.log(count)

        const totalPages = Math.ceil(count/limit);
        res.render('product-results',{productData,totalPages,search,page,filter:'htl',categoryData})
    } catch (error) {
        console.log(error)
    }
}

const payByWallet = async(req,res) =>{
    try {
        console.log("Paybywallet working")
        const totalAmount = parseFloat(req.body.totalPrice)
        const email = req.session.email
        // const addressIndex = req.body.flexRadioDefault
        const userData = await User.findOne({email:email}).populate('cart.productId')
        if(userData.wallet<totalAmount){
            console.log("inside if")
            res.json({Status:'failed'})
        }else{
            await User.findOneAndUpdate({email:email},{$inc:{wallet:-totalAmount}})
            res.json({Status:'success'})
        }
    } catch (error) {
        console.log(error)
    }
}

const applyReferral = async(req,res) =>{
    try {
        console.log(req.body)
        const referralCode = req.body.ref_code
        const userData = await User.findOne({ref_code:referralCode})
        if(userData){
            console.log("User Found")
            req.session.referralAmount = 200;
            req.session.referralCode = referralCode;
            res.json({success:"The referral amount will be added"})
        }else{
            console.log("User not found")
            res.json({error:"No such referral were found"})
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = {loadLogin,loadRegister,insertUser,loadHome,verifyOtp,forgotPassword,sendForgotMail,
    resetPassword,setPassword,getProductDetails,resendOtp,verifyResendOtp,loadVerifyOtp,loadOTP,loadAccount,
    getCart,addToCart,removeCartItem,getCheckoutProducts,editAddress,addAddress,commitAddAddress,commitEditAddress,
    updateQuantity,getHome,logoutUser,getOrderDetails,updateInfo,clearAllCart,editAddressFromCheckout,
    commitEditAddressFromCheckout,getProductResults,filterByAscending,filterByDescending,applyCoupon,payByWallet,
    applyReferral,getWishlist,addToWishlist,addToCartFromWishlist,removeFromWishlist,deleteAddress}