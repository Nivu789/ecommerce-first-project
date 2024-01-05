const Category = require('../models/categoryModel');
const cron = require('node-cron');
const Product = require('../models/productModel')

const checkCategoryOffer = cron.schedule('0 * * * * *', async() => {
    try {
        console.log("Checking")
        const expiredCategoryProducts = await Product.find({
            categoryid: {
                $in: await Category.distinct('_id', { offerExpiry: { $lte: Date.now() } })
            }
            
        });
        const CategoryData = await Category.find({offerExpiry:{$lte:Date.now()}});
        CategoryData.map(category=>{
            category.discountPercentage = 0;
            return category.save();
        })
        
        const updatePromises = expiredCategoryProducts.map(async (product) => {
            if(product.discountPercentage==0&&product.dealOfDay==false){
                product.salePrice = product.regularPrice
                return product.save();
            }
            // product.discountPercentage = 0;
            
        });
    
       
        await Promise.all(updatePromises);
        
     
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });

  module.exports = {checkCategoryOffer}