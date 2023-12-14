const express = require('express');
const adminRoute = express();
const adminFunctions = require('../controllers/adminController')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Product = require('../models/productModel')
const adminAuth = require('../auth/adminAuthentication')
const session = require('express-session')
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex'); 

adminRoute.set('views','./views/admin');

adminRoute.use(session({
  secret:secret,
  resave: false,
  saveUninitialized: true,
}))

adminRoute.get('/',adminAuth.isLogout,adminFunctions.getLogin)

adminRoute.post('/',adminFunctions.loadDashboard)

adminRoute.get('/dashboard',adminAuth.isLogin,adminFunctions.getDashboard)

adminRoute.get('/products',adminAuth.isLogin,adminFunctions.displayProducts)

adminRoute.get('/category',adminAuth.isLogin,adminFunctions.displayCategories)

adminRoute.get('/createproduct',adminAuth.isLogin,adminFunctions.loadCreateProduct)

adminRoute.post('/createproduct',upload.array('image', 4),adminFunctions.createProduct)

adminRoute.get('/editproduct',adminAuth.isLogin,upload.array('image',4),adminFunctions.editProduct)

adminRoute.post('/editproduct',upload.array('image',4),adminFunctions.commitProductUpdate)

adminRoute.get('/blockproduct',adminAuth.isLogin,adminFunctions.blockProduct)

adminRoute.get('/unblockproduct',adminAuth.isLogin,adminFunctions.unblockProduct)

adminRoute.post('/category',adminFunctions.createCategory)

adminRoute.get('/blockcategory',adminAuth.isLogin,adminFunctions.blockCategory)

adminRoute.get('/unblockcategory',adminAuth.isLogin,adminFunctions.unblockCategory)

adminRoute.get('/editcategory',adminAuth.isLogin,adminFunctions.editCategory)

adminRoute.post('/editcategory',adminFunctions.commitCategoryUpdate)

adminRoute.get('/deletecategory',adminAuth.isLogin,adminFunctions.deleteCategory)

adminRoute.get('/users',adminAuth.isLogin,adminFunctions.loadUsers)

adminRoute.get('/blockuser',adminAuth.isLogin,adminFunctions.blockUser)

adminRoute.get('/unblockuser',adminAuth.isLogin,adminFunctions.unblockUser)

adminRoute.get('/userdetails',adminAuth.isLogin,adminFunctions.loadUserDetails)

adminRoute.delete('/deleteImage/:productId/:index',adminAuth.isLogin, async (req, res) => {
    try {
        
      const productId = req.params.productId;
      const imageIndex = req.params.index;
      const product=await Product.findOne({_id:productId})
      console.log(imageIndex);
      product.image.splice(imageIndex,1)

      const updated = await product.save()

       
        if (updated) {
            return res.redirect(`/admin/editproduct/${productId}`)
          }else{
            return res.status(500).send('error')
          }
    

    } catch (error) {
      console.log(error.message);
      return res.status(500).send('Internal server error')
    }
  });

  adminRoute.get('/logout',adminAuth.isLogin,adminFunctions.logoutAdmin)


  adminRoute.get('/orderlist',adminAuth.isLogin,adminAuth.isLogin,adminFunctions.getOrderList)

  adminRoute.get('/orderdetails',adminAuth.isLogin,adminAuth.isLogin,adminFunctions.getOrderDetails)

  adminRoute.post('/saveorderdetails',adminFunctions.commitOrderDetails)

  adminRoute.get('/brands',adminAuth.isLogin,adminFunctions.getBrands)

  adminRoute.post('/createbrand',adminFunctions.createBrand)

  adminRoute.get('/blockbrand',adminAuth.isLogin,adminFunctions.blockBrand)

  adminRoute.get('/unblockbrand',adminAuth.isLogin,adminFunctions.unblockBrand)

  adminRoute.get('/editbrand',adminAuth.isLogin,adminFunctions.editBrand)

  adminRoute.post('/editbrand',adminFunctions.commitEditBrand)

  adminRoute.get('/productoffers',adminFunctions.getProductOffers)

  adminRoute.post('/saveproductoffer',adminFunctions.commitProductOffers)

  adminRoute.get('/categoryoffers',adminFunctions.getCategoryOffers)

  adminRoute.post('/savecategoryoffers',adminFunctions.commitCategoryOffers)

  adminRoute.get('/coupons',adminFunctions.getAllCoupons)

  adminRoute.post('/createcoupon',adminFunctions.createCoupon)

  adminRoute.get('/editcoupon',adminFunctions.editCoupon)

  adminRoute.post('/saveeditedcoupon',adminFunctions.saveEditedCoupon)

module.exports = adminRoute;