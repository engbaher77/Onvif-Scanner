const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');


// Protect Routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Set Token from Bearer token in headers
    if(
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
        //console.log('token', token);
    }

    // Set Token from cookie
    else if(req.cookies.token) {
        token = req.cookies.token;
    }



    // Make sure token exists
    if(!token)
        return next(
            new ErrorResponse(
                `Not authorized to access this route`, 401
            )
        )



    // Decode token and find user            
    try {
        // Verify token
        const decode = jwt.verify(token, process.env.JWT_SECRET);

        // Get User info from db and assign it to req always available
        req.user = await User.findById(decode.id);

        next();
    } catch (err) {
        return next(
            new ErrorResponse(
                `Not authorized to access this route`, 401
            )
        )
    }
});


// Grant access to specific roles
exports.authorize = (...roles) => {
    return(req, res, next) => {
       if(!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(
                    `User role (${req.user.role}) is not authorized to access this route`
                    , 403
                )
            )       
        } 
        next();
    }
};