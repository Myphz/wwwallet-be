// Auth errors
export const CREDENTIALS_ERROR = { message: "Invalid credentials", status: 401 }; // wrong username or password
export const EMAIL_REGISTERED_ERROR = { message: "Email already registered", status: 409 };
export const INVALID_PARAMETERS = { message: "Invalid parameters format", status: 422 }; // e.g, the email is not a valid email
export const MISSING_PARAMETERS = { message: "Missing required parameters", status: 400 };