const User = require('../models/UserModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel')
const Coupon = require('../models/couponModel')
const generateOrderId = require('../functions/orderIdGenerator')

const placeOrder = async(req,res) =>{
    try {
        const email = req.session.email;
        const userData = await User.findOne({email:email}).populate('cart.productId')
        const addressIndex = req.body.flexRadioDefault
        const totalAmount = req.body.totalAmount
        const paymentMethod = req.body.payment_option
        console.log(totalAmount)
        console.log("Coupon code from place order",req.body.couponCode)
        const userCart = userData.cart;

        let updatePromises = [];
        console.log("PAYMENT METHOD IS",paymentMethod)
        // Iterate through the items in the user's cart
        userCart.forEach((item) => {
            // Update the quantity in the database
            const updatePromise = Product.updateOne(
                { _id: item.productId._id },
                { $inc: { quantity: -item.quantity } }
            );
            
            updatePromises.push(updatePromise);
        });

        // Wait for all the quantity updates to complete
        await Promise.all(updatePromises);
        
        let arr = [];
        userData.cart.forEach((item)=>{
            arr.push({
                productId:item.productId._id,
                quantity:item.quantity
            })
        })

        const userId = userData._id;
       await Coupon.findOneAndUpdate({couponcode:req.body.couponCode},{$push:{redeemedUsers:userId}})
       
       let randomOrderId = await generateOrderId();
       console.log("Random generted order id",randomOrderId)
       let order;
       if(paymentMethod==='online'||paymentMethod==='wallet'){
        order = new Order({
            userId:userData._id,
            products:arr,
            addressIndex:addressIndex,
            totalAmount:totalAmount,
            paymentMethod:paymentMethod,
            paymentStatus:"Success",
            orderId:randomOrderId
        })
       }else{


        order = new Order({
            userId:userData._id,
            products:arr,
            addressIndex:addressIndex,
            totalAmount:totalAmount,
            paymentMethod:paymentMethod,
            orderId:randomOrderId
        })
       }
       

        const orderData = await order.save();
        console.log("prder order",orderData)
        if(orderData){
            await User.updateOne({ email: email }, { $set: { cart: [] } });
            res.redirect(`/account?id=${userData._id}`)
        }

        
    } catch (error) {
        console.log(error)
    }
}

const cancelOrder = async(req,res) =>{
    try {
        const email = req.session.email;
        const userData = await User.findOne({email:email})
        const orderId = req.query.id;
        console.log(orderId)
        const orderData = await Order.findById({_id:orderId})
        const totalAmount = parseFloat(orderData.totalAmount)
        let arr = []
        for(i=0;i<orderData.products.length;i++){
            arr.push(orderData.products[i].quantity) 
        }
        console.log(arr)

        for (let i = 0; i < orderData.products.length; i++) {
            const productId = orderData.products[i].productId;
            const quantityToAdd = arr[i];

            // Find the product by ID and update the quantity
            await Product.findByIdAndUpdate(
                { _id: productId },
                { $inc: { quantity: +quantityToAdd } }
            );
        }
        await User.findOneAndUpdate({email:email},{$set:{cart:[]}})
        if(orderData.orderStatus==='Delivered'){
            await Order.findByIdAndUpdate({_id:orderId},{$set:{orderStatus:"Returned"}})
        }else{
            await Order.findByIdAndUpdate({_id:orderId},{$set:{orderStatus:"Cancelled"}})
        }
        
        if(orderData.paymentStatus==="Success"){
            await User.findOneAndUpdate({email:email},{$inc:{wallet:+totalAmount}})
        }
        
        res.redirect(`/account?id=${userData._id}`)
    } catch (error) {
        console.log(error)
    }
}


module.exports = {placeOrder,cancelOrder}