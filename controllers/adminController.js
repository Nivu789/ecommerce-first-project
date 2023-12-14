const User = require('../models/UserModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Order = require('../models/orderModel')
const Brand = require('../models/brandModel')
const Coupon = require('../models/couponModel')

//hello
const getLogin = async(req,res) =>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error)
    }
}


const getDashboard = async(req,res) =>{
    try {
        res.render('dashboard')
    } catch (error) {
        console.log(error)
    }
}

const loadDashboard = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password
        const userData = await User.findOne({ email: email })
        if (userData.is_admin == 1) {
            if (userData.password == password) {
                req.session.activeAdmin = true
                res.redirect('/admin/dashboard')
            }else{
                res.render('login',{message:"Email or password mismatch"})
            }
        } else {
            res.render('login', { message: "You are not an admin" })
        }
    } catch (error) {
        console.log(error)
    }
}



const displayProducts = async (req, res) => {
    try {
        const productData = await Product.find({})
        res.render('product-list', { productData })
    } catch (error) {
        console.log(error)
    }
}

const displayCategories = async (req, res) => {
    try {
        const categoryData = await Category.find({})
        res.render('category', { categoryData, message: '' })
    } catch (error) {
        console.log(error)
    }
}

const loadCreateProduct = async (req, res) => {
    try {
        const categoryData = await Category.find({})
        const brandData = await Brand.find({})
        res.render('addproduct',{categoryData,message:'',brandData})
    } catch (error) {
        console.log(error)
    }
}

const createProduct = async (req, res) => {
    try {
        const productName = req.body.productName;
        const categoryData = await Category.find({})
        const brandData = await Brand.find({})
        
        if (/^\s|\s$/.test(productName)||parseFloat(req.body.regularPrice)<0||parseFloat(req.body.salePrice)<0) {
            console.log("white")
            res.render('addproduct',{message:'0',categoryData,brandData})
        }else{
            const imageUrls = req.files.map((file) => 'uploads/' + file.filename);

            const requestedQuantity = parseInt(req.body.quantity, 10);

            // Check if requestedQuantity is a valid number and greater than or equal to 0
            const quantity = !isNaN(requestedQuantity) && requestedQuantity >= 0 ? requestedQuantity : 1;
        const product = new Product({
            productName: req.body.productName,
            brand: req.body.brand,
            description: req.body.description,
            categoryid: req.body.category,
            // regularPrice: req.body.price,
            description: req.body.description,
            regularPrice: req.body.regularPrice,
            salePrice: req.body.salePrice,
            quantity:quantity,
            image: imageUrls,
            is_active: true
        })
        await product.save();
        res.redirect('/admin/products')
        }
        

    } catch (error) {
        console.log(error)
    }
}

const editProduct = async (req, res) => {
    try {
        const id = req.query.id
        const productData = await Product.findOne({ _id: id }).populate('brand.brand')
        const categoryData = await Category.find({})
        const brandData = await Brand.find({})
        res.render('editproduct', { products: productData ,categoryData,message:"",brandData})
    } catch (error) {
        console.log(error)
    }
}

const commitProductUpdate = async (req, res) => {
    try {
        const productName = req.body.productName;
        console.log(productName)
        const id = req.query.id;
        
        const product = await Product.findOne({ _id: id })
        const categoryData = await Category.find({})
        const brandData = await Brand.find({})
        if (/^\s|\s$/.test(productName)||parseFloat(req.body.regularPrice)<0||parseFloat(req.body.salePrice)<0) {
            console.log("white")
            res.render('editproduct', { message: "0", products:product,categoryData,brandData})
        }else{
            let Newimages = []
        req.files.forEach((image) => {
            Newimages.push(
                image.path
            )
        })


        Newimages.forEach((image) => {
            product.image.push(
                image

            )
        })
        await product.save()

        console.log(req.body.categoryId)
        await Product.findByIdAndUpdate({ _id: id }, {
            $set: {
                productName: req.body.productName, brand: req.body.brand, description: req.body.description,
                regularPrice: req.body.regularPrice, salePrice: req.body.salePrice, categoryid:req.body.categoryId
            }
        })

        res.redirect('/admin/products')
        }
        
    } catch (error) {
        console.log(error)
    }
}

const blockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id)
        await Product.findByIdAndUpdate({ _id: id }, { $set: { is_active: false } })
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error)
    }
}

const unblockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        await Product.findByIdAndUpdate({ _id: id }, { $set: { is_active: true } })
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error)
    }
}

const createCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName;
        const categoryData = await Category.find({})
        if (/\s/.test(categoryName)) {
            res.render('category', { message: "1", categoryData: categoryData})
        }else{
            const categoryInfo = await new Category({
                categoryName: req.body.categoryName,
                description: req.body.description,
                is_active: true
            })
            const is_category = await Category.findOne({ categoryName: req.body.categoryName });
        const categoryData = await Category.find({})
        if (is_category) {
            res.render('category', { message: "0", categoryData: categoryData })
        } else {
            await categoryInfo.save();
            res.redirect('/admin/category')
        }
        }  

    } catch (error) {
        console.log(error)
    }
}

const blockCategory = async (req, res) => {
    try {
        const id = req.query.id;
        await Category.findByIdAndUpdate({ _id: id }, { $set: { is_active: false } })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error)
    }
}

const unblockCategory = async (req, res) => {
    try {
        const id = req.query.id;
        await Category.findByIdAndUpdate({ _id: id }, { $set: { is_active: true } })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error)
    }
}

const editCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await Category.findOne({ _id: id })
        res.render('editcategory', { categoryData, message: '' })
    } catch (error) {
        console.log(error)
    }
}

const commitCategoryUpdate = async (req, res) => {
    try {
        const id = req.query.id;
        await Category.findByIdAndUpdate({ _id: id }, { $set: { categoryName: req.body.categoryName, description: req.body.description } })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error)
    }
}

const deleteCategory = async (req, res) => {
    try {
        const id = req.query.id;
        await Category.findByIdAndDelete({ _id: id })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error)
    }
}

const loadUsers = async (req, res) => {
    try {
        const userData = await User.find({})
        res.render('userdata', { userData })
    } catch (error) {
        console.log(error)
    }
}

const blockUser = async (req, res) => {
    try {
        const id = req.query.id;
        await User.findByIdAndUpdate({ _id: id }, { $set: { is_active: false } });
        delete req.session.activeUser
        req.session.save();
        res.redirect('/admin/users')
    } catch (error) {
        console.log(error)
    }
}

const unblockUser = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id)
        await User.findByIdAndUpdate({ _id: id }, { $set: { is_active: true } });
        res.redirect('/admin/users')
    } catch (error) {
        console.log(error)
    }
}

const loadUserDetails = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findOne({ _id: id })
        console.log(userData)
        res.render('userdetails', { userData })
    } catch (error) {
        console.log(error)
    }
}

const logoutAdmin = async(req,res) =>{
    try {
        if(req.session.activeAdmin){
            delete req.session.activeAdmin
            req.session.save();
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error)
    }
}

const getOrderList = async(req,res) =>{
    try {
        const orderData = await Order.find({}).populate({
            path :'userId',
            model : User,
            select : 'name email' 
        })
        console.log(orderData)
        res.render('orderlist',{orderData})
    } catch (error) {
        console.log(error)
    }
}

const getOrderDetails = async(req,res) =>{
    try {
        const orderId = req.query.id;
        const orderData = await Order.findOne({_id:orderId}).populate({
            path:'products.productId',
            model: Product,
            select : 'productName image regularPrice'
        }).populate({
            path: 'userId', // Replace with your actual path
            model: User,
            select: 'name phone address'
        });
        console.log(orderData)
        console.log(orderData.products)
        if(orderData){
            res.render('orderdetails',{orderData})
        }
        
    } catch (error) {
        console.log(error)
    }
}

const commitOrderDetails = async(req,res) =>{
    try {
        const status = req.body.status;
        const orderId = req.body.orderId
        console.log(status)
        if(status==='Delivered'){
            await Order.findByIdAndUpdate({_id:orderId},{$set:{orderStatus:status,paymentStatus:"Success"}})
        }else{
             await Order.findByIdAndUpdate({_id:orderId},{$set:{orderStatus:status}})
        }
        res.redirect('/admin/orderlist')
    } catch (error) {
        console.log(error)
    }
}

const getBrands = async(req,res) =>{
    try {
        const brandData = await Brand.find({})
        res.render('brand',{brandData,message:''})
    } catch (error) {
        console.log(error)
    }
}

const createBrand = async(req,res) =>{
    try {
        const brandName = req.body.brandname
        const is_brand = await Brand.findOne({brandName:req.body.brandname})
        const brandData = await Brand.find({})
        if(is_brand){
            res.render('brand',{brandData,message:'0'})
        }else if(/^\s|\s$/.test(brandName)){
            res.render('brand', { message: "1", brandData})
        }else{
            const brand = new Brand({
                brandName:req.body.brandname,
                description:req.body.description,
                is_active:1
            })
            await brand.save();
            res.redirect('/admin/brands')
        }
        
    } catch (error) {
        console.log(error)
    }
}

const blockBrand = async(req,res) =>{
    try {
        const brandId = req.query.id;
        const brandData = await Brand.findByIdAndUpdate({_id:brandId},{$set:{is_active:false}})
        await Product.updateMany({brand:brandId},{$set:{is_active:false}})
        // await Product.findMany({brand:brandId})
        if(brandData){
            res.redirect('/admin/brands')
        }
    } catch (error) {
        console.log(error)
    }
}

const unblockBrand = async(req,res) =>{
    try {
        const brandId = req.query.id;
        const brandData = await Brand.findByIdAndUpdate({_id:brandId},{$set:{is_active:true}})
        await Product.updateMany({brand:brandId},{$set:{is_active:true}})
        if(brandData){
            res.redirect('/admin/brands')
        }
    } catch (error) {
        console.log(error)
    }
}

const editBrand = async(req,res) =>{
    try {
        const orderId = req.query.id;
        const brandData = await Brand.findById({_id:orderId})
        res.render('editbrand',{brandData,message:''})
    } catch (error) {
        console.log(error)
    }
}

const commitEditBrand = async(req,res) =>{
    try {
        const brandName = req.body.brandname;
        const brandId = req.query.id;
        console.log(brandName)
        const brandData = await Brand.findById({_id:brandId})
        if(/^\s|\s$/.test(brandName)){
            res.render('editbrand',{brandData,message:'0'})
        }else{
            const updatedBrandData = await Brand.findByIdAndUpdate({_id:brandId},{$set:{brandName:req.body.brandname,description:req.body.description}})
            if(updatedBrandData){
                res.redirect('/admin/brands')
            }
        }
        
        
    } catch (error) {
        console.log(error)
    }
}


const getProductOffers = async(req,res) =>{
    try {
        const productData = await Product.find({})
        res.render('product-offer',{productData})
    } catch (error) {
        console.log(error)
    }
}

const commitProductOffers = async(req,res) =>{
    try {
        const productId = req.body.productId;
        const offerPrice = req.body.result;
        console.log(offerPrice)
        const discountPercentage = req.body.discountPercentage
        console.log(productId)
        await Product.findByIdAndUpdate({_id:productId},{$set:{salePrice:offerPrice,discountPercentage:discountPercentage}});
        res.redirect('/admin/productoffers')
    } catch (error) {
        console.log(error)
    }
}


const getCategoryOffers = async(req,res) =>{
    try {
        const categoryData = await Category.find({})
        res.render('category-offer',{categoryData})
    } catch (error) {
        console.log(error)
    }
}

const commitCategoryOffers = async(req,res) =>{
    try {
        const categoryId = req.body.categoryId;
        const discountPercentage = parseInt(req.body.result);
        const products = await Product.find({ categoryid: categoryId });

        await Category.findByIdAndUpdate({_id:categoryId},{$set:{discountPercentage:discountPercentage}})
        const updatedProducts = products.map(product => {
                if(product.discountPercentage==0){
                    const previousSalePrice = parseFloat(product.regularPrice);
                const newSalePrice = previousSalePrice * (1 - discountPercentage / 100);
                console.log(newSalePrice)

            // Update the product with the new salePrice
            return Product.findByIdAndUpdate(product._id, { $set: { salePrice: newSalePrice } }, { new: true });
            
                }
                
            
        });
        await Promise.all(updatedProducts);
        res.redirect('/admin/categoryoffers')
    } catch (error) {
        console.log(error)
    }
}


const getAllCoupons = async(req,res) =>{
    try {
        const couponData = await Coupon.find({})
        res.render('coupons',{couponData})
    } catch (error) {
        console.log(error)
    }
}

const createCoupon = async(req,res) =>{
    try {
        const couponCode = req.body.couponCode
        const discountAmount = req.body.discountAmount
        const date = req.body.date
        const description = req.body.description
        const minimumAmount = req.body.minimumPurchase
        
        const couponData = new Coupon({
            couponcode:couponCode,
            status:true,
            discount:discountAmount,
            minPurchase:minimumAmount,
            expiryDate:date,
            limit:1,
            redeemedUsers:null,
            description:description
        })

        await couponData.save();
        res.redirect('/admin/coupons')
    } catch (error) {
        console.log(error)
    }
}

const editCoupon = async(req,res) =>{
    try {
        const id = req.query.id;
        
    } catch (error) {
        console.log(error)
    }
}

const saveEditedCoupon = async(req,res) =>{
    try {
        const {couponCode,discount,minPurchase,expiryDate,description,couponId} = req.body
        console.log(couponId)
        const couponData = await Coupon.findByIdAndUpdate({_id:couponId},{$set:{couponcode:couponCode,discount:discount,
            minPurchase:minPurchase,expiryDate:expiryDate,description:description,limit:1}})
        if(couponData){
            console.log("SUCESS YEAH")
            res.redirect('/admin/coupons')
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    loadDashboard, displayProducts, displayCategories, loadCreateProduct,
    createProduct, editProduct, commitProductUpdate,
    blockProduct, unblockProduct, createCategory, blockCategory, unblockCategory, editCategory,
    commitCategoryUpdate, deleteCategory, loadUsers, unblockUser, blockUser, loadUserDetails,logoutAdmin,
    getLogin,getDashboard,getOrderList,getOrderDetails,commitOrderDetails,getBrands,createBrand,blockBrand,
    unblockBrand,editBrand,commitEditBrand,getProductOffers,commitProductOffers,getCategoryOffers,
    commitCategoryOffers,getAllCoupons,createCoupon,editCoupon,saveEditedCoupon
}