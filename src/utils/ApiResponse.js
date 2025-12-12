// src/utils/ApiResponse.js
class ApiResponse {
  static success(data = null, message = 'OK') {
    return {
      success: true,
      message,
      data
    };
  }

  static error(message = 'Error', data = null) {
    return {
      success: false,
      message,
      data
    };
  }
}

module.exports = ApiResponse;
