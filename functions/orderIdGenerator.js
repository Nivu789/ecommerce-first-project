const randomstring = require('randomstring');
const Order = require('../models/orderModel')

async function generateOrderId(){
   do{
     const randomString = "OD"+randomstring.generate(5);
    randomNumber = Math.floor(100 + Math.random() * 900).toString();
    var orderId = (randomString+randomNumber)
    orderIdExist =await Order.findOne({orderId:orderId})
   }while(orderIdExist)

   return orderId
}


module.exports = generateOrderId;