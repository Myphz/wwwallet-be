import app from "./src/config/app.js";
import { PORT } from "./src/config/config.js";
import authRouter from "./src/routes/auth.router.js";
import cryptoRouter from "./src/routes/crypto.router.js";
import transactionsRouter from "./src/routes/transactions.router.js";
import accountRouter from "./src/routes/account.router.js";
import { logError } from "./src/helpers/logger.helper.js";

app.use("/api/auth", authRouter);
app.use("/api/crypto", cryptoRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/account", accountRouter);

app.use((err, req, res, next) => {
  const isExpected = !!err.status;
  res.status(err.status || 500);
	res.json({ success: false, msg: isExpected ? err.message : "Server Error" });
  if (!isExpected) logError(err);
});

app.listen(PORT);