const app = require("./src/config/app");
const authRouter = require("./src/routes/auth.router");
const { PORT } = require("./src/config/config");

app.use("/api/auth", authRouter);
app.listen(PORT);