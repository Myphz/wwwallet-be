import app from "./src/config/app.js";
import authRouter from "./src/routes/auth.router.js";
import binanceRouter from "./src/routes/binance.router.js";

import { PORT } from "./src/config/config.js";

app.use("/api/auth", authRouter);
app.use("/api/binance", binanceRouter);

app.listen(PORT);