const errorHandler = (error, req, res, next) => {

    console.error(error);

    res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Internal Server Error'
    });

};

export default errorHandler;