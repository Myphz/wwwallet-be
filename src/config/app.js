require("./database"); // Load database configuration
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

// Only allow requests from FE
app.use(cors({ origin: "http://localhost:5000", credentials: true }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

module.exports = app;