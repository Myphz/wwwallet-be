import app from "./src/config/app.js";
import authRouter from "./src/routes/auth.router.js";
import cryptoRouter from "./src/routes/crypto.router.js";

import { PORT } from "./src/config/config.js";

app.use("/api/auth", authRouter);
app.use("/api/crypto", cryptoRouter);

app.listen(PORT);