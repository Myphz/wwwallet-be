import express from "express";
import app from "./src/config/app.js";
import { PORT } from "./src/config/config.js";
import apiRouter from "./src/routers/api.router.js";
import { logError } from "./src/helpers/logger.helper.js";
import history from "connect-history-api-fallback";

app.use("/api", apiRouter);

const staticMiddleware = express.static("dist");
app.use(staticMiddleware);
// Support history api
// this is the HTTP request path not the path on disk
app.use(history({ index: "/index.html" }));
// 2nd call for redirected requests
app.use(staticMiddleware);

// Global error handler function
app.use((err, req, res, next) => {
  // Check if the error object has a status (i.e, if it's one from config/errors.js)
  const isExpected = !!err.status;
  // Set the status if declared or 500
  res.status(err.status || 500);
  // Send the error message if expected
	res.json({ success: false, msg: isExpected ? err.message : "Server Error" });
  // Log error if not expected
  if (!isExpected) logError(err);
});

app.listen(PORT);