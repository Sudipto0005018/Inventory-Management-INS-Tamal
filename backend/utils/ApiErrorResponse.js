const ApiResponse = require("./ApiResponse");
class ApiErrorResponse extends ApiResponse {
    constructor(statusCode, data = {}, message = "Something went wrong", seassonExpired = false) {
        super(statusCode, data, message);
        this.success = false;
        this.seassonExpired = seassonExpired;
    }
}
module.exports = ApiErrorResponse;
