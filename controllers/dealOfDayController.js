const Product = require('../models/productModel')
const DealOfDay = require('../models/dealOfDay')
const cron = require('node-cron');


const checkDealOfDay = cron.schedule('0 * * * * *', async() => {
    console.log("Del of day")
    const date = new Date(Date.now());
    const year = date.getFullYear();
    const month = date.getMonth()+1;
    const day = date.getDate();
    const actualDate = `${year}-${month<10?0:''}${month}-${day<10?0:''}${day}`
    const dealsToUpdate = await DealOfDay.find({active:false});
    for (i=0;i<dealsToUpdate.length;i++) {
        let productId = dealsToUpdate[i].productId
        let product = await Product.findById({_id:productId});
        let regularPrice = product.regularPrice
        await Product.findByIdAndUpdate({_id:productId},{$set:{salePrice:regularPrice}})
    }
    const activeDeal = await DealOfDay.findOneAndUpdate({expiryDate:actualDate},{$set:{active:true}})
    await DealOfDay.updateMany(
        { _id: { $ne: activeDeal._id } }, // Exclude the document updated above
        { $set: { active: false } }
    );
})

const addDealOfDay = async(req,res) =>{
    try {
        const caption = req.body.caption;
        const index = req.body.index;
        const productId = req.body.productId
        const file = req.file;
        const productSalePrice = req.body.salePrice
        const regularPrice = req.body.regularPrice
        const productData = await Product.findById({_id:productId});
        if(productData.discountPercentage>0){
            res.redirect('/admin/deal-day?status=failed')
        }else{
            const currentDate = new Date();
        const currentDayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
            console.log("INDEX is",index)
        // Calculate the difference in days to the upcoming day based on the index
        const daysToAdd = (index - currentDayOfWeek + 7) % 7;

        // Set the expiration date to the same day of the week as indicated by the index
        const expirationDate = new Date(currentDate);
        expirationDate.setDate(currentDate.getDate() + daysToAdd);
        const year = expirationDate.getFullYear();
        const month = expirationDate.getMonth()+1;
        const day = expirationDate.getDate();
        const date = `${year}-${month<10?0:''}${month}-${day<10?0:''}${day}`
        // console.log(date)
        const dealOfDayData = await new DealOfDay({
            index:index,
            caption:caption,
            expiryDate:date,
            productId:productId,
            image:file.path,
            salePrice:productSalePrice,
            regularPrice:regularPrice
        })
        console.log(productSalePrice)
        console.log(productId)
        
        await Product.findByIdAndUpdate({_id:productId},{$set:{salePrice:productSalePrice,dealOfDay:true}})
        
        await dealOfDayData.save();

        if(dealOfDayData){
            res.redirect('/admin/deal-day')
        }
        }
        
    } catch (error) {
        console.log(error)
    }
}

const editDealOfDay = async(req,res) =>{
    try {
       const index = req.body.index;
       console.log(index)
       const dealData = await DealOfDay.findOne({index:index}).populate('productId');
       res.json({dealData}) 
    } catch (error) {
        console.log(error)
    }
}

const commitEditDealOfDay = async(req,res) =>{
    try {
        console.log(req.body)
        const index = req.body.index;
        

// Calculate the next occurrence of the specified day
        const currentDate = new Date();
        const currentDayOfWeek = currentDate.getDay();
        const daysToAdd = (index - currentDayOfWeek + 7) % 7;
        const expirationDate = new Date(currentDate);
        expirationDate.setDate(currentDate.getDate() + daysToAdd);
        const year = expirationDate.getFullYear();
        const month = expirationDate.getMonth()+1;
        const day = expirationDate.getDate();
        const date = `${year}-${month<10?0:''}${month}-${day<10?0:''}${day}`
        await Product.findOneAndUpdate({productName:req.body.buttonText},{$set:{salePrice:req.body.newSalePrice}});
        await DealOfDay.findByIdAndUpdate({_id:req.body.idOfBanner},{$set:{salePrice:req.body.newSalePrice,expiryDate:date}})
        res.redirect('/admin/deal-day')
    } catch (error) {
        console.log(error)
    }
}

module.exports = {addDealOfDay,editDealOfDay,commitEditDealOfDay}