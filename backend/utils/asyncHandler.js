const ApiErrorResponse = require("./ApiErrorResponse");
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error("Error detected:", error);

        const statusCode = error.statusCode || 500;

        return res
            .status(statusCode)
            .json(new ApiErrorResponse(statusCode, {}, error.message || "Internal Server Error"));
    }
};

module.exports = asyncHandler;
