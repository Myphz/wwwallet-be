// Generic error
export const INVALID_PARAMETERS = { message: "Invalid parameters format", status: 422 }; // e.g, the email is not a valid email
export const MISSING_PARAMETERS = { message: "Missing required parameters", status: 400 };

// Auth errors
export const CREDENTIALS_ERROR = { message: "Invalid credentials", status: 401 }; // wrong username or password
export const EMAIL_REGISTERED_ERROR = { message: "Email already registered", status: 409 };
export const EXPIRED_LINK = { status: 401, message: "The link has expired" };
export const EMAIL_NOT_FOUND = { status: 404, message: "The email is not registered" };

// Binance error
export const BINANCE_ERROR = { message: "Binance fetch error", status: 404 };

// Transactions errors
export const TRANSACTION_NOT_FOUND = { message: "Invalid transaction id", status: 404 };
export const TRANSACTION_INVALID = { message: "Insufficient balance. Please update or delete other transactions.", status: 422 };

// Limiter handler
export const LIMIT_ERROR = (req, res) => res.status(429).json({ success: false, msg: "Too many requests. Please try again later" });