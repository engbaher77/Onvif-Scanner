const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };

    error.message = err.message;

    // Dev Logging
    console.log(err);

    // Error name
    if(err.message === 'Query values must be an array') {
        const message = `Server Error Params Error`;
        error = new ErrorResponse(message, 400);
    }

    // Error syntax
    if(err.line === '1180') {
        const message = `Server Error Syntax Error`;
        error = new ErrorResponse(message, 500);
    }

    // Params Error
    if(err.code === '42703' | '42803') {
        const message = `${error.message}`;
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
}

module.exports = errorHandler;