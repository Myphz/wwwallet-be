import app from "./src/config/app.js";
import { PORT } from "./src/config/config.js";
import authRouter from "./src/routes/auth.router.js";
import cryptoRouter from "./src/routes/crypto.router.js";
import transactionsRouter from "./src/routes/transactions.router.js";
import accountRouter from "./src/routes/account.router.js";

app.use("/api/auth", authRouter);
app.use("/api/crypto", cryptoRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/account", accountRouter);

app.use((err, req, res, next) => {
  res.status(err.status);
	res.json({ success: false, msg: err.message });
});

app.listen(PORT);