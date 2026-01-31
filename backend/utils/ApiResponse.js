class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.success = true;
  }
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}

module.exports = ApiResponse;
