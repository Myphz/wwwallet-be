module.exports = {
  // Auth errors
  CREDENTIALS_ERROR: { message: "Invalid credentials", status: 401 }, // wrong username or password
  EMAIL_REGISTERED_ERROR: { message: "Email already registered", status: 409 },
  INVALID_PARAMETERS: { message: "Invalid parameters format", status: 422 }, // e.g, the email is not a valid email
  MISSING_PARAMETERS: { message: "Missing required parameters", status: 400 },
};