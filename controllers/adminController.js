const User = require('../models/UserModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Order = require('../models/orderModel')
const Brand = require('../models/brandModel')
const Coupon = require('../models/couponModel')
const sharp = require('sharp');
const fs = require('fs');
const fse = require('fs-extra');
const Banner = require('../models/bannerModel')
const DealOfDay = require('../models/dealOfDay')
const Contact = require('../models/contactModel')

//hello
const getLogin = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error)
    }
}


const getDashboard = async (req, res) => {
    try {
        // Aggregate orders by month and count the number of products
        const orderData = await Order.aggregate([
            {
                $unwind: '$products' // Unwind the products array
            },
            {
                $group: {
                    _id: { month: { $month: '$orderDate' } },
                    totalOrders: { $sum: 1 },
                    totalProducts: { $sum: '$products.quantity' },
                }
            },
            {
                $sort: {
                    '_id.month': 1 // Sort by month
                }
            }
        ]);

        const fullOrderData = await Order.find({}).sort({orderDate:-1}).populate('userId')

        const orderAmount = await Order.aggregate([
            {
              $group: {
                _id: null,
                totalAmountSum: { $sum: { $toDouble: '$totalAmount' } },
                totalOrders: { $sum: 1 }
              }
            }
          ])

        const totalAmount = orderAmount[0].totalAmountSum
        const totalOrders = orderAmount[0].totalOrders

        const productData = await Product.aggregate([
            {
                $group:{
                    _id:null,
                    totalProducts:{$sum:1}
                }
            }
        ])

        const totalProducts = productData[0].totalProducts

        const userData = await User.aggregate([
            {
                $group: {
                    _id: { $month: '$accountCreated' },
                    totalRegister: { $sum: 1 },
                }
            },
            {
                $sort: {
                    '_id': 1 // Sort by month
                }
            }
        ]);


        const totalUsersFind = await User.aggregate([
            {
                $group:{
                    _id:null,
                    totalUsers:{$sum:1}
                }
            }
        ])
        
        const totalUsers = totalUsersFind[0].totalUsers

        const categoryData = await Product.aggregate([
            {
                $group: {
                    _id: '$categoryid',
                    totalProducts: { $sum: '$quantity' }
                }
            },
            {
                $lookup: {
                    from: 'categories',  // Assuming your category collection is named 'categories'
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            },
            {
                $project: {
                    _id: 0,
                    categoryName: '$category.categoryName',
                    totalProducts: 1
                }
            }
        ]);
        console.log(categoryData)

        const orderStats = await Order.aggregate([
            {
              $unwind: '$products'
            },
            {
              $lookup: {
                from: 'products',
                localField: 'products.productId',
                foreignField: '_id',
                as: 'productInfo'
              }
            },
            {
              $unwind: '$productInfo'
            },
            {
              $lookup: {
                from: 'categories',
                localField: 'productInfo.categoryid',
                foreignField: '_id',
                as: 'categoryInfo'
              }
            },
            {
              $group: {
                _id: '$categoryInfo._id',
                categoryName: { $first: '$categoryInfo.categoryName' },
                orderCount: { $sum: 1 }
              }
            }
          ]);
            console.log(orderStats)
            const categoryNames = JSON.stringify(orderStats.map(stat => stat.categoryName).flat());
            const orderCounts = JSON.stringify(orderStats.map(stat => stat.orderCount));

            console.log(categoryNames)
            console.log(orderCounts)
        // Extracting the total orders and products for each month
        const monthlyData = Array.from({ length: 12 }, (_, index) => {
            const monthOrderData = orderData.find(item => item._id.month === index + 1) || { totalOrders: 0, totalProducts: 0 };
            const monthUserData = userData.find(item => item._id === index + 1) || { totalRegister: 0 };
            return {
                totalOrders: monthOrderData.totalOrders,
                totalProducts: monthOrderData.totalProducts,
                totalRegister: monthUserData.totalRegister
            };
            
        });

        console.log(monthlyData)
        

        const totalOrdersJson= JSON.stringify(monthlyData.map(item => item.totalOrders));
        const totalProductsJson = JSON.stringify(monthlyData.map(item => item.totalProducts));
        const totalRegisterJson = JSON.stringify(monthlyData.map(item => item.totalRegister));

        const categoryLabelsJson = JSON.stringify(categoryData.map(item => item.categoryName));
        console.log(categoryLabelsJson)
        const categoryValuesJson = JSON.stringify(categoryData.map(item => item.totalProducts));
      
        res.render('dashboard', { totalOrdersJson,totalProductsJson ,totalRegisterJson, categoryLabelsJson, categoryValuesJson,
            totalAmount,totalOrders,totalProducts,totalUsers,fullOrderData,categoryNames,orderCounts});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const loadDashboard = async (req, res) => {
    try {
        const email = req.body.email
        console.log(email)
        const password = req.body.password
        const userData = await User.findOne({ email: email })
        console.log(userData)
        if (userData.is_admin == 1) {
            if (userData.password == password) {
                req.session.activeAdmin = true
                res.redirect('/admin/dashboard')
            } else {
                res.render('login', { message: "Email or password mismatch" })
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
        res.render('addproduct', { categoryData, message: '', brandData })
    } catch (error) {
        console.log(error)
    }
}

const createProduct = async (req, res) => {
    try {
        const productName = req.body.productName;
        const categoryData = await Category.find({})
        const brandData = await Brand.find({})

        if (/^\s|\s$/.test(productName) || parseFloat(req.body.regularPrice) < 0 || parseFloat(req.body.salePrice) < 0) {
            console.log("white")
            res.render('addproduct', { message: '0', categoryData, brandData })
        } else if(parseFloat(req.body.regularPrice) < parseFloat(req.body.salePrice)){
            res.render('addproduct', { message: '1', categoryData, brandData })
        }
        else {
            let imageOk=true;
            for(i=0;i<req.files.length;i++){
                if(req.files[i].mimetype!=='image/png'&&req.files[i].mimetype!=='image/jpeg'&&req.files[i].mimetype!=='image/webp'){
                    imageOk=false;
                    break;
                }
            }
            if(!imageOk){
                res.render('addproduct', { message: '2', categoryData, brandData })
            }
            
                
            else{
                const imagePromises = req.files.map(async (file) => {
                    const imagePath = `uploads/${file.filename}`;
                    const resizedImagePath = `uploads/resized_${file.filename}`;
                    await sharp(imagePath)
                        .resize({ width: 572, height: 572 })
                        .toFile(resizedImagePath);
    
                    // Remove the original uploaded image
                    // fs.unlinkSync(imagePath);
                    fse.remove(imagePath, (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('File deleted successfully');
                        }
                    });
    
                    return resizedImagePath;
                });
    
                const resizedImageUrls = await Promise.all(imagePromises);
    
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
                    quantity: quantity,
                    image: resizedImageUrls,
                    is_active: true
                })
                await product.save();
                res.redirect('/admin/products')
            }
            
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
        res.render('editproduct', { products: productData, categoryData, message: "", brandData })
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
        if (/^\s|\s$/.test(productName) || parseFloat(req.body.regularPrice) < 0 || parseFloat(req.body.salePrice) < 0) {
            console.log("white")
            res.render('editproduct', { message: "0", products: product, categoryData, brandData })
        }else if(parseFloat(req.body.regularPrice) < parseFloat(req.body.salePrice)){
            res.render('editproduct', { message: "1", products: product, categoryData, brandData })
        }
         else {
            let Newimages = []

            let imageOk=true;
            for(i=0;i<req.files.length;i++){
                if(req.files[i].mimetype!=='image/png'&&req.files[i].mimetype!=='image/jpeg'&&req.files[i].mimetype!=='image/webp'){
                    imageOk=false;
                    break;
                }
            }
            if(!imageOk){
                res.render('editproduct', { message: "2", products: product, categoryData, brandData })
            }else{
                await Promise.all(req.files.map(async (file) => {
                    const imagePath = `uploads/${file.filename}`;
                    const resizedImagePath = `uploads/resized_${file.filename}`;
    
                    // Resize the image
                    await sharp(imagePath)
                        .resize({ width: 572, height: 572 })
                        .toFile(resizedImagePath);
    
    
    
                    // Push the resized image path to Newimages array
                    Newimages.push(resizedImagePath);
                }));
    
                // Now that all asynchronous operations are completed, proceed with further processing
                Newimages.forEach((image) => {
                    product.image.push(image);
                });
    
                // Save the product
                await product.save();
    
                console.log(req.body.categoryId)
                await Product.findByIdAndUpdate({ _id: id }, {
                    $set: {
                        productName: req.body.productName, brand: req.body.brand, description: req.body.description,
                        regularPrice: req.body.regularPrice, salePrice: req.body.salePrice, categoryid: req.body.categoryId
                    }
                })
    
                res.redirect('/admin/products')
            }

            
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
            res.render('category', { message: "1", categoryData: categoryData })
        } else {
            let imageOk=true;
            for(i=0;i<req.files.length;i++){
                if(req.files[i].mimetype!=='image/png'&&req.files[i].mimetype!=='image/jpeg'&&req.files[i].mimetype!=='image/webp'){
                    imageOk=false;
                    break;
                }
            }
            if(!imageOk){
                res.render('category', { message: "2", categoryData: categoryData })
            }else{
                const imagePromises = req.files.map(async (file) => {
                    const imagePath = `uploads/${file.filename}`;
                    const resizedImagePath = `uploads/resized_${file.filename}`;
                    await sharp(imagePath)
                        .resize({ width: 572, height: 572 })
                        .toFile(resizedImagePath);
    
                    // Remove the original uploaded image
                    // fs.unlinkSync(imagePath);
                    fse.remove(imagePath, (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('File deleted successfully');
                        }
                    });
    
                    return resizedImagePath;
                });
    
                const resizedImageUrls = await Promise.all(imagePromises);
    
                const categoryInfo = await new Category({
                    categoryName: req.body.categoryName,
                    description: req.body.description,
                    is_active: true,
                    image: resizedImageUrls
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
        const categoryData = await Category.findById({ _id: id })
        console.log(req.body.categoryName)
        const categoryExist = await Category.findOne({ categoryName: req.body.categoryName })
        if (categoryExist) {
            res.render('editcategory', { categoryData, message: '0' })
        } else {
            let imageOk=true;
            for(i=0;i<req.files.length;i++){
                if(req.files[i].mimetype!=='image/png'&&req.files[i].mimetype!=='image/jpeg'&&req.files[i].mimetype!=='image/webp'){
                    imageOk=false;
                    break;
                }
            }
            if(!imageOk){
                res.render('editcategory', { categoryData, message: '1' })
            }else{
                if (req.files.length==0) {
                    console.log("No photo")
                    await Category.findByIdAndUpdate({ _id: id }, { $set: { categoryName: req.body.categoryName, description: req.body.description } })
                    res.redirect('/admin/category')
                }else {
                    let Newimages = []
    
                    categoryData.image = [];
    
                    await Promise.all(req.files.map(async (file) => {
                        const imagePath = `uploads/${file.filename}`;
                        const resizedImagePath = `uploads/resized_${file.filename}`;
    
                        // Resize the image
                        await sharp(imagePath)
                            .resize({ width: 572, height: 572 })
                            .toFile(resizedImagePath);
    
    
    
                        // Push the resized image path to Newimages array
                        Newimages.push(resizedImagePath);
                        categoryData.image.push(resizedImagePath);
                    }));
                    console.log(Newimages)
                    // Now that all asynchronous operations are completed, proceed with further processing
    
    
    
    
                    // Save the product
                    await categoryData.save();
                    await Category.findByIdAndUpdate({ _id: id }, { $set: { categoryName: req.body.categoryName, description: req.body.description } })
    
                    res.redirect('/admin/category')
                }
            }
            
            
        } 
    
    }catch (error) {
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

    const logoutAdmin = async (req, res) => {
        try {
            if (req.session.activeAdmin) {
                delete req.session.activeAdmin
                req.session.save();
                res.redirect('/admin')
            }
        } catch (error) {
            console.log(error)
        }
    }

    const getOrderList = async (req, res) => {
        try {
            const orderData = await Order.find({}).sort({orderDate:-1}).populate('userId')
            res.render('orderlist', { orderData })
        } catch (error) {
            console.log(error)
        }
    }

    const getOrderDetails = async (req, res) => {
        try {
            const orderId = req.query.id;
            const orderData = await Order.findOne({ _id: orderId }).populate({
                path: 'products.productId',
                model: Product,
                select: 'productName image regularPrice'
            }).populate({
                path: 'userId', // Replace with your actual path
                model: User,
                select: 'name phone address email'
            });
            console.log(orderData)
            console.log(orderData.products)
            if (orderData) {
                res.render('orderdetails', { orderData })
            }

        } catch (error) {
            console.log(error)
        }
    }

    const commitOrderDetails = async (req, res) => {
        try {
            const status = req.body.status;
            const orderId = req.body.orderId
            console.log(status)
            if (status === 'Delivered') {
                await Order.findByIdAndUpdate({ _id: orderId }, { $set: { orderStatus: status, paymentStatus: "Success" } })
            } else {
                await Order.findByIdAndUpdate({ _id: orderId }, { $set: { orderStatus: status } })
            }
            res.redirect('/admin/orderlist')
        } catch (error) {
            console.log(error)
        }
    }

    const getBrands = async (req, res) => {
        try {
            const brandData = await Brand.find({})
            res.render('brand', { brandData, message: '' })
        } catch (error) {
            console.log(error)
        }
    }

    const createBrand = async (req, res) => {
        try {
            const brandName = req.body.brandname
            const is_brand = await Brand.findOne({ brandName: req.body.brandname })
            const brandData = await Brand.find({})

            if (is_brand) {
                res.render('brand', { brandData, message: '0' })
            } else if (/^\s|\s$/.test(brandName)) {
                res.render('brand', { message: "1", brandData })
            } else {
                let imageOk=true;
                for(i=0;i<req.files.length;i++){
                if(req.files[i].mimetype!=='image/png'&&req.files[i].mimetype!=='image/jpeg'&&req.files[i].mimetype!=='image/webp'){
                    imageOk=false;
                    break;
                }
                }
                if(!imageOk){
                    res.render('brand', { message: "2", brandData })
                }else{
                    const imagePromises = req.files.map(async (file) => {
                        const imagePath = `uploads/${file.filename}`;
                        const resizedImagePath = `uploads/resized_${file.filename}`;
                        await sharp(imagePath)
                            .resize({ width: 572, height: 572 })
                            .toFile(resizedImagePath);
    
                        // Remove the original uploaded image
                        // fs.unlinkSync(imagePath);
                        fse.remove(imagePath, (err) => {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('File deleted successfully');
                            }
                        });
    
                        return resizedImagePath;
                    });
    
                    const resizedImageUrls = await Promise.all(imagePromises);
    
                    const brand = new Brand({
                        brandName: req.body.brandname,
                        description: req.body.description,
                        is_active: 1,
                        image: resizedImageUrls
                    })
                    await brand.save();
                    res.redirect('/admin/brands')
                }
                
            }

        } catch (error) {
            console.log(error)
        }
    }

    const blockBrand = async (req, res) => {
        try {
            const brandId = req.query.id;
            const brandData = await Brand.findByIdAndUpdate({ _id: brandId }, { $set: { is_active: false } })
            await Product.updateMany({ brand: brandId }, { $set: { is_active: false } })
            // await Product.findMany({brand:brandId})
            if (brandData) {
                res.redirect('/admin/brands')
            }
        } catch (error) {
            console.log(error)
        }
    }

    const unblockBrand = async (req, res) => {
        try {
            const brandId = req.query.id;
            const brandData = await Brand.findByIdAndUpdate({ _id: brandId }, { $set: { is_active: true } })
            await Product.updateMany({ brand: brandId }, { $set: { is_active: true } })
            if (brandData) {
                res.redirect('/admin/brands')
            }
        } catch (error) {
            console.log(error)
        }
    }

    const editBrand = async (req, res) => {
        try {
            const orderId = req.query.id;
            const brandData = await Brand.findById({ _id: orderId })
            res.render('editbrand', { brandData, message: '' })
        } catch (error) {
            console.log(error)
        }
    }

    const commitEditBrand = async (req, res) => {
        try {
            const brandName = req.body.brandname;
            const brandId = req.query.id;
            console.log(brandName)
            const brandData = await Brand.findById({ _id: brandId })
            const brandExist = await Brand.findOne({ brandName: brandName })
            if (brandExist) {
                res.render('editbrand', { brandData, message: '1' })

            } else if (/^\s|\s$/.test(brandName)) {
                res.render('editbrand', { brandData, message: '0' })
            } else {
                console.log("Else")
                let imageOk=true;
                for(i=0;i<req.files.length;i++){
                if(req.files[i].mimetype!=='image/png'&&req.files[i].mimetype!=='image/jpeg'&&req.files[i].mimetype!=='image/webp'){
                    imageOk=false;
                    break;
                }
            }
                if(!imageOk){
                    console.log("HERE")
                    res.render('editbrand', { brandData, message: '2' })
                }else{
                    if(req.files.length>0){
                        const imagePromises = req.files.map(async (file) => {
                            const imagePath = `uploads/${file.filename}`;
                            const resizedImagePath = `uploads/resized_${file.filename}`;
                            await sharp(imagePath)
                                .resize({ width: 572, height: 572 })
                                .toFile(resizedImagePath);
        
                            // Remove the original uploaded image
                            // fs.unlinkSync(imagePath);
                            fse.remove(imagePath, (err) => {
                                if (err) {
                                    console.error(err);
                                } else {
                                    console.log('File deleted successfully');
                                }
                            });
        
                            return resizedImagePath;
                        });
        
                        const resizedImageUrls = await Promise.all(imagePromises);
                        // const imagePath = `uploads/${req.files[0].filename}`;
                        await Brand.findByIdAndUpdate({ _id: brandId }, { $set: { brandName: req.body.brandname, description: req.body.description, image: resizedImageUrls } })
                    }else{
                        await Brand.findByIdAndUpdate({ _id: brandId }, { $set: { brandName: req.body.brandname, description: req.body.description } })
                    }
                    res.redirect('/admin/brands')
                }
               
            
        }

        } catch (error) {
            console.log(error)
        }
    }


    const getProductOffers = async (req, res) => {
        try {
            const productData = await Product.find({})
            res.render('product-offer', { productData })
        } catch (error) {
            console.log(error)
        }
    }

    const commitProductOffers = async (req, res) => {
        try {
            const productId = req.body.productId;
            const offerPrice = req.body.result;
            console.log(offerPrice)
            const discountPercentage = req.body.discountPercentage
            console.log(productId)
            await Product.findByIdAndUpdate({ _id: productId }, { $set: { salePrice: offerPrice, discountPercentage: discountPercentage } });
            res.redirect('/admin/productoffers')
        } catch (error) {
            console.log(error)
        }
    }


    const getCategoryOffers = async (req, res) => {
        try {
            const categoryData = await Category.find({})
            res.render('category-offer', { categoryData })
        } catch (error) {
            console.log(error)
        }
    }

    const commitCategoryOffers = async (req, res) => {
        try {
            const categoryId = req.body.categoryId;
            const discountPercentage = parseInt(req.body.result);
            const products = await Product.find({ categoryid: categoryId });
            const offerExpiry = req.body.offerExpiry
            await Category.findByIdAndUpdate({ _id: categoryId }, { $set: { discountPercentage: discountPercentage, offerExpiry: offerExpiry } })
            const updatedProducts = products.map(product => {
                if (product.discountPercentage == 0) {
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


    const getAllCoupons = async (req, res) => {
        try {
            const status = req.query.status||null
            const error = req.query.error||null
            const couponData = await Coupon.find({})
            if(error){
                res.render('coupons',{couponData,message:'1'})
            }
            else if(status=="failed"){
                res.render('coupons', { couponData ,message:'0'})
            }
            else if(status=="failedwithspace"){
                res.render('coupons', { couponData ,message:'2'})
            }
            else{
                res.render('coupons', { couponData ,message:''})
            }
            
        } catch (error) {
            console.log(error)
        }
    }

    const createCoupon = async (req, res) => {
        try {
            const couponCode = req.body.couponCode
            const discountAmount = req.body.discountAmount
            const date = req.body.date
            const description = req.body.description
            const minimumAmount = req.body.minimumPurchase
            const couponExist = await Coupon.findOne({couponcode:couponCode})
            if(couponExist){
                res.redirect('/admin/coupons?status=failed')
            }else if (/\s/.test(couponCode)){
                res.redirect('/admin/coupons?status=failedwithspace')
            }
            else{
                if(req.body.offerType==='Flat Offer'){
                    const couponData = new Coupon({
                        couponcode: couponCode,
                        status: true,
                        discount: discountAmount,
                        minPurchase: minimumAmount,
                        expiryDate: date,
                        limit: 1,
                        description: description
                    })
                    await couponData.save();
                    res.redirect('/admin/coupons')
                }else{
                    if(discountAmount>99){
                        res.redirect('/admin/coupons?error=percentage')
                    }else{
                        const couponData = new Coupon({
                            couponcode: couponCode,
                            status: true,
                            offerPercentage:discountAmount,
                            minPurchase: minimumAmount,
                            expiryDate: date,
                            limit: 1,
                            description: description
                        })
                        await couponData.save();
                        res.redirect('/admin/coupons')
                    }
                    
                }
                
                
            }
            
        } catch (error) {
            console.log(error)
        }
    }

    const editCoupon = async (req, res) => {
        try {
            const id = req.query.id;

        } catch (error) {
            console.log(error)
        }
    }

    const saveEditedCoupon = async (req, res) => {
        try {
            let couponData;
            const { couponCode, discount, minPurchase, expiryDate, description, couponId ,editOfferType} = req.body
            console.log(couponId)
            if(editOfferType==='Flat Offer'){
                couponData = await Coupon.findByIdAndUpdate({ _id: couponId }, {
                    $set: {
                        couponcode: couponCode, discount: discount,offerPercentage:0,
                        minPurchase: minPurchase, expiryDate: expiryDate, description: description, limit: 1
                    }
                })
                res.json({message:''})
            }else if(editOfferType==='Percentage Offer'){
                if(discount>99){
                    res.json({message:"Failed"})
                    return 
                }else{
                    couponData = await Coupon.findByIdAndUpdate({ _id: couponId }, {
                        $set: {
                            couponcode: couponCode, discount: 0,offerPercentage:discount,
                            minPurchase: minPurchase, expiryDate: expiryDate, description: description, limit: 1
                        }
                    })
                }
                
            }
            
            if (couponData) {
                console.log("SUCESS YEAH")
                res.redirect('/admin/coupons')
            }
        } catch (error) {
            console.log(error)
        }
    }


    const removeCoupon = async(req,res) =>{
        try {
            const couponId = req.body.couponId;
            await Coupon.findByIdAndDelete({_id:couponId});
            res.redirect('/admin/coupons')
        } catch (error) {
            console.log(error)
        }
    }

    const deleteCategoryOffer = async (req, res) => {
        try {
            const categoryId = req.body.categoryId;
            await Category.findByIdAndUpdate({ _id: categoryId }, { $set: { discountPercentage: 0 ,flatOfferAmount:0} });
            const products = await Product.find({ categoryid: categoryId })
            console.log(products)
            const updatedProducts = await products.map((product) => {
                if (product.discountPercentage == 0) {
                    product.salePrice = product.regularPrice
                    return product.save();
                }
            })
            if (updatedProducts) {
                res.json({ status: "Success" })
            }
        } catch (error) {
            console.log(error)
        }
    }

    const editCategoryOffers = async (req, res) => {
        try {
            console.log(req.body)
            const categoryId = req.body.categoryId;
            const categoryData = await Category.findById({ _id: categoryId });
            const offerPercentage = categoryData.discountPercentage
            const offerExpiry = categoryData.offerExpiry
            const flatOfferAmount = categoryData.flatOfferAmount
            console.log(offerPercentage)
            res.json({ offerPercentage,offerExpiry ,flatOfferAmount})
        } catch (error) {
            console.log(error)
        }
    }

    const commitEditCategoryOffers = async (req, res) => {
        try {
            const categoryId = req.body.categoryId
            const discountPercentage = req.body.newOfferPercentage
            console.log("discountPercentage",discountPercentage)
            const expiryDate = req.body.date
            console.log(expiryDate)
            if(discountPercentage!==undefined){
                console.log("Inside if itself")
                await Category.findByIdAndUpdate({ _id: categoryId }, { $set: { discountPercentage: req.body.newOfferPercentage , offerExpiry:expiryDate} })
            const products = await Product.find({ categoryid: categoryId });
            const updatedProducts = products.map(product => {
                if (product.discountPercentage == 0) {
                    const previousSalePrice = parseFloat(product.regularPrice);
                    const newSalePrice = previousSalePrice * (1 - discountPercentage / 100);
                    console.log(newSalePrice)

                    // Update the product with the new salePrice
                    return Product.findByIdAndUpdate(product._id, { $set: { salePrice: newSalePrice } }, { new: true });

                }


            });
            await Promise.all(updatedProducts);
            res.json({ status: "Success" })
            }else{
                console.log("Coming in else")
                const newflatAmount = parseFloat(req.body.newFlatAmount);
                await Category.findByIdAndUpdate({ _id: categoryId }, { $set: { flatOfferAmount: newflatAmount , offerExpiry:expiryDate} })
                const products = await Product.find({ categoryid: categoryId });
            const updatedProducts = products.map(product => {
                if (product.discountPercentage == 0) {
                    const previousSalePrice = parseFloat(product.regularPrice);
                    const newSalePrice = parseFloat(previousSalePrice -newflatAmount);
                    console.log(newSalePrice)

                    // Update the product with the new salePrice
                    return Product.findByIdAndUpdate(product._id, { $set: { salePrice: newSalePrice } }, { new: true });

                }


            });
            await Promise.all(updatedProducts);
            res.json({ status: "Success" })
            }
            
        } catch (error) {
            console.log(error)
        }
    }

    const getBannerManagement = async (req, res) => {
        try {
            const bannerData = await Banner.find({})
            res.render('banner-manager', { bannerData })
        } catch (error) {
            console.log(error)
        }
    }

    const addBanner = async (req, res) => {
        try {
            if (req.body.bannerName === 'First Banner') {
                const imagePromises = req.files.map(async (file) => {
                    const imagePath = `uploads/${file.filename}`;
                    const resizedImagePath = `uploads/resized_${file.filename}`;
                    await sharp(imagePath)
                        .resize({ width: 572, height: 572 })
                        .toFile(resizedImagePath);

                    // Remove the original uploaded image
                    // fs.unlinkSync(imagePath);
                    fse.remove(imagePath, (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('File deleted successfully');
                        }
                    });

                    return resizedImagePath;
                });

                const resizedImageUrls = await Promise.all(imagePromises);

                const banner = await new Banner({
                    bannerName: req.body.bannerName,
                    image: resizedImageUrls,
                    bannerText: req.body.bannerText
                })
                await banner.save();
                res.redirect('/admin/banner-management')
            }

            //Second banner

            if (req.body.bannerName === 'Second Banner') {
                const imagePromises = req.files.map(async (file) => {
                    const imagePath = `uploads/${file.filename}`;
                    const resizedImagePath = `uploads/resized_${file.filename}`;
                    await sharp(imagePath)
                        .resize({ width: 300, height: 170 })
                        .toFile(resizedImagePath);

                    // Remove the original uploaded image
                    // fs.unlinkSync(imagePath);
                    fse.remove(imagePath, (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('File deleted successfully');
                        }
                    });

                    return resizedImagePath;
                });

                const resizedImageUrls = await Promise.all(imagePromises);

                const banner = await new Banner({
                    bannerName: req.body.bannerName,
                    image: resizedImageUrls,
                    bannerText: req.body.bannerText
                })
                await banner.save();
                res.redirect('/admin/banner-management')
            }

        } catch (error) {
            console.log(error)
        }
    }

    const editBanner = async (req, res) => {
        try {

            console.log(req.body.bannerId)
            console.log(req.files)
            const bannerId = req.body.bannerId;
            console.log(bannerId)
            const bannerData = await Banner.findById({ _id: req.body.bannerId });
            console.log(bannerData)
            bannerData.image = [];
            console.log(bannerData.image)
            //     const imagePromises = req.files.map(async (file) => {
            //         const imagePath = `uploads/${file.filename}`;
            //          const resizedImagePath = `uploads/resized_${file.filename}`;
            //          await sharp(imagePath)
            //         .resize({ width: 300, height: 170})
            //         .toFile(resizedImagePath);

            // //   Remove the original uploaded image
            //         fs.unlinkSync(imagePath);
            //         fse.remove(imagePath, (err) => {
            //             if (err) {
            //               console.error(err);
            //             } else {
            //               console.log('File deleted successfully');
            //             }
            //           });

            //          return resizedImagePath;
            //         });

            //         const resizedImageUrls = await Promise.all(imagePromises);
            //         console.log(resizedImageUrls)
            console.log(req.files[0].filename)
            const imagePath = `uploads/${req.files[0].filename}`;
            bannerData.image = [];
            console.log(bannerData.image)
            await Banner.findByIdAndUpdate({ _id: req.body.bannerId }, { $set: { image: imagePath, bannerText: req.body.bannerText } })
            res.redirect('/admin/banner-management')


        } catch (error) {
            console.log(error)
        }
    }

    const editProductOffer = async (req, res) => {
        try {
            console.log(req.body)
            const productId = req.body.productId;
            const productData = await Product.findById({ _id: productId })
            const newPercentage = req.body.editedPercentage;

            const regularPrice = productData.regularPrice;
            const valueToDeduce = regularPrice * (newPercentage / 100);
            const newAmount = regularPrice - valueToDeduce;
            const updatedOffer = await Product.findByIdAndUpdate({ _id: productId }, { $set: { discountPercentage: newPercentage, salePrice: newAmount } })
            if (updatedOffer) {
                res.redirect('/admin/productoffers')
            }
        } catch (error) {
            console.log(error)
        }
    }

    const deleteProductOffer = async (req, res) => {
        try {
            const productId = req.body.productid
            const productData = await Product.findById({ _id: productId }).populate('categoryid');
            const regularPrice = productData.regularPrice
            await Product.findByIdAndUpdate({ _id: productId }, { $set: { discountPercentage: 0, salePrice: regularPrice } })
            res.redirect('/admin/productoffers')
        } catch (error) {
            console.log(error)
        }
    }


    const getSalesReport = async(req,res) =>{
        try {
            let orderData;
            console.log(req.query.search)
            if (req.query.from && req.query.to && req.query.search) {
                console.log("If");
                orderData = await Order.find({
                    $or: [
                        { orderId: { $regex: '.*' + req.query.search + '.*' } },
                        { paymentMethod: { $regex: '.*' + req.query.search + '.*' } }
                    ],
                    orderDate: {
                        $gte: new Date(req.query.from),
                        $lte: new Date(req.query.to)
                    }
                });
                console.log(orderData);
                // Use orderData as needed
            
            }else if(req.query.from&&req.query.to){
                console.log("Else if")
                orderData = await Order.find({
                    orderDate: {
                       $gte: new Date(req.query.from),
                       $lte: new Date(req.query.to)
                     }
                  });
            }else if(req.query.search){
                orderData = await Order.find({
                    $or: [
                        { orderId: { $regex: '.*' + req.query.search + '.*' } },
                        { paymentMethod: { $regex: '.*' + req.query.search + '.*' } }
                    ]
                });
            }else{
                console.log("Else")
                orderData = await Order.find({}).sort({orderDate:-1})
            }
            
            let onlinePayments=0;
            let cashPayments=0;
            let cancelledOrders = 0
            let totalAmount = 0;
            orderData.forEach(item=>{
                if(item.paymentMethod==="online"){
                    onlinePayments++;
                }else if(item.paymentMethod==="cash"){
                    cashPayments++;
                }
                if(item.orderStatus==="Cancelled"){
                    cancelledOrders++;
                }
                totalAmount += parseInt(item.totalAmount)
            })
            const noOfUsers = await Order.distinct("userId");
            distinctUserLength = noOfUsers.length;
            res.render('salesreport',{orderData,onlinePayments,cashPayments,cancelledOrders,totalAmount,distinctUserLength})
        } catch (error) {
            console.log(error)
        }
    }

    const filterReport = async(req,res) =>{
        try {
            const search = req.body.search || ''
            if(req.body.from_date&&req.body.to_date){
                const fromDate = req.body.from_date
                const toDate = req.body.to_date
                res.redirect(`/admin/salesreport?from=${fromDate}&to=${toDate}&search=${search}`)
            }else{
                res.redirect(`/admin/salesreport?search=${search}`)
            }   
            
        } catch (error) {
            console.log(error)
        }
    }

    const setFlatDiscountCategory = async(req,res) =>{
        try {
            const flatOfferAmount = parseInt(req.body.result)
            const categoryId = req.body.categoryId
            const products = await Product.find({ categoryid: categoryId });
            const offerExpiry = req.body.offerExpiry
            await Category.findByIdAndUpdate({ _id: categoryId }, { $set: { flatOfferAmount: flatOfferAmount, offerExpiry: offerExpiry } })
            const updatedProducts = products.map(product => {
                if (product.discountPercentage == 0) {
                    const previousSalePrice = parseFloat(product.regularPrice);
                    const newSalePrice = previousSalePrice - flatOfferAmount;
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

    const setDealOfTheDay = async(req,res) =>{
        try {
            const productData = await Product.find({})
            const dealOfDayData = await DealOfDay.find({active:true})
            const fullDealOfDayData = await DealOfDay.find({})
            if(req.query.status=="failed"){
                res.render('deal-of-the-day',{productData,dealOfDayData,fullDealOfDayData,message:'0'})
            }else{
                res.render('deal-of-the-day',{productData,dealOfDayData,fullDealOfDayData,message:''})
            }
            
        } catch (error) {
            console.log(error)
        }
    }


    const getAllContacts = async(req,res) =>{
        try {
            const contactData = await Contact.find({})
            res.render('contacts',{contactData})
        } catch (error) {
            console.log(error)
        }
    }

    const markContactAsRead = async(req,res) =>{
        try {
            const contactId = req.body.contactId;
            await Contact.findByIdAndUpdate({_id:contactId},{$set:{readByAdmin:true}})
            res.status(200).json({message:"Success"})
        } catch (error) {
            console.log(error)
        }

    }


    module.exports = {
        loadDashboard, displayProducts, displayCategories, loadCreateProduct,
        createProduct, editProduct, commitProductUpdate,
        blockProduct, unblockProduct, createCategory, blockCategory, unblockCategory, editCategory,
        commitCategoryUpdate, deleteCategory, loadUsers, unblockUser, blockUser, loadUserDetails, logoutAdmin,
        getLogin, getDashboard, getOrderList, getOrderDetails, commitOrderDetails, getBrands, createBrand, blockBrand,
        unblockBrand, editBrand, commitEditBrand, getProductOffers, commitProductOffers, getCategoryOffers,
        commitCategoryOffers, getAllCoupons, createCoupon, editCoupon, saveEditedCoupon, deleteCategoryOffer,
        editCategoryOffers, commitEditCategoryOffers, getBannerManagement, 
        addBanner, editBanner, editProductOffer, deleteProductOffer,getSalesReport,filterReport,setFlatDiscountCategory,removeCoupon,
        setDealOfTheDay,getAllContacts,markContactAsRead
    }