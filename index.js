require("./src/config/database"); // Load database configuration
const cors = require("cors");
const express = require("express");
const authRouter = require("./src/routes/auth.router");
const cookieParser = require("cookie-parser");

const app = express();
const port = 3000;
// Only allow requests from FE
app.use(cors({ origin: "http://localhost:5000", credentials: true }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);

app.listen(port);