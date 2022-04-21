import app from "./src/config/app";
import authRouter from "./src/routes/auth.router";
import { PORT } from "./src/config/config";

app.use("/api/auth", authRouter);
app.listen(PORT);