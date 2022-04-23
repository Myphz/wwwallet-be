import app from "./src/config/app.js";
import { PORT } from "./src/config/config.js";
import authRouter from "./src/routes/auth.router.js";
import cryptoRouter from "./src/routes/crypto.router.js";
import transactionsRouter from "./src/routes/transactions.router.js";

app.use("/api/auth", authRouter);
app.use("/api/crypto", cryptoRouter);
app.use("/api/transactions", transactionsRouter);

app.listen(PORT);