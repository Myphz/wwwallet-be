import express from "express";
import authRouter from "./auth.router.js";
import cryptoRouter from "./crypto.router.js";
import transactionsRouter from "./transactions.router.js";
import accountRouter from "./routers/account.router.js";

const router = express.Router();

router.use("/api/auth", authRouter);
router.use("/api/crypto", cryptoRouter);
router.use("/api/transactions", transactionsRouter);
router.use("/api/account", accountRouter);

export default router;