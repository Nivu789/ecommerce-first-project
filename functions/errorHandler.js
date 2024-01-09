const errorHandler = (err, req, res, next) => {
    console.log("Errorrrrrrr")
    console.error(err.stack);
    res.status(500).render('user/error-page'); // Redirect to the error page
    next();
  };
  
  module.exports = errorHandler;