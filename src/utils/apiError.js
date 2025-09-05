class ApiError extends Error {
  constructor(
    statusCode,
    message = "somenthing went wrong",
    errors = [],
    statck,
  ) {
    super(message);
    this.message=message
    this.statusCode=statusCode
    this.errors=errors

    if (statck) {
        this.statck=statck
    }else{
        Error.captureStackTrace(this,this.constructor)
    }

  }
}

export {ApiError}
  