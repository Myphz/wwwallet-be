import app from "./src/config/app.js";
import { PORT } from "./src/config/config.js";
import apiRouter from "./src/routers/api.router.js";
import { logError } from "./src/helpers/logger.helper.js";
import history from "connect-history-api-fallback";

const staticMiddleware = express.static("dist");

app.use(staticMiddleware);

// Support history api
// this is the HTTP request path not the path on disk
app.use(history({ index: "/index.html" }));

// 2nd call for redirected requests
app.use(staticMiddleware);

app.use("/api", apiRouter);

app.use((err, req, res, next) => {
  const isExpected = !!err.status;
  res.status(err.status || 500);
	res.json({ success: false, msg: isExpected ? err.message : "Server Error" });
  if (!isExpected) logError(err);
});

app.listen(PORT);