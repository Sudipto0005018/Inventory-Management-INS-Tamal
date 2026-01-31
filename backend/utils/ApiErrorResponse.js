const ApiResponse = require("./ApiResponse");
class ApiErrorResponse extends ApiResponse {
  constructor(
    statusCode,
    data = {},
    message = "Something went wrong",
    sessionExpired = false,
  ) {
    super(statusCode, data, message);
    this.success = false;
    this.sessionExpired = sessionExpired;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      ...(this.sessionExpired !== undefined && {
        sessionExpired: this.sessionExpired,
      }),
    });
  }
}
module.exports = ApiErrorResponse;
