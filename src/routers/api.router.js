import express from "express";
import authRouter from "./auth.router.js";
import cryptoRouter from "./crypto.router.js";
import transactionsRouter from "./transactions.router.js";
import accountRouter from "./account.router.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/crypto", cryptoRouter);
router.use("/transactions", transactionsRouter);
router.use("/account", accountRouter);

export default router;