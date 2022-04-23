import app from "../config/app.js";
import request from "supertest";
import mongoose from "mongoose";
import User from "../models/user";
import authRouter from "../routes/auth.router.js";
import transactionsRouter from "../routes/transactions.router.js";

app.use("/", transactionsRouter);
app.use("/auth", authRouter);

afterAll(async () => {
  await User.deleteMany({});
	await mongoose.connection.close();
});

describe("Test transactions system", () => {
  const email = "testemail@email.com";
  const password = "testpassword12";
  const transactionData =  { crypto: "BTC", base: "USDC", isBuy: true, price: "24323.2342", quantity: "1.430000002", date: 332412223, notes: "test notes" };
  let jwt;

  beforeEach(async () => {
    await User.deleteMany({});
    // Save the user and get jwt token
    const res = await request(app).post("/auth/register").send({ email, password });
    jwt = res.headers["set-cookie"][0];
  });

  describe("Test create & get transaction endpoint", () => {
    it("creates and gets a new transaction", async () => {
      // Create transaction
      let res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));
      // Get transactions
      res = await request(app).get("/").set("Cookie", jwt).expect(200);
      const data = res.body;
      expect(data.success).toBe(true);
      // Expect only 1 transaction
      expect(Object.keys(data.transactions).length).toBe(1);
      const transactions = data.transactions[transactionData.crypto];
      expect(transactions.length).toBe(1);

      const transaction = transactions[0];
      const { crypto, ...remaining } = transactionData;
      // Check that the transaction is the same as the data sent, minus the crypto key
      expect(transaction).toEqual(expect.objectContaining({
        ...remaining,
        _id: expect.any(String),
      }));
    });

    it("throws error on parameters missing or invalid values", async () => {
      // Missing 'crypto'
      let { crypto, ...testData } = transactionData;
      let res = await request(app).post("/").set("Cookie", jwt).send(testData).expect(400);
      expect(res.body).toEqual(expect.objectContaining({ success: false, msg: expect.any(String) }));
      // Missing 'quantity'
      let { quantity, ...testData2 } = transactionData;
      res = await request(app).post("/").set("Cookie", jwt).send(testData2).expect(400);
      expect(res.body).toEqual(expect.objectContaining({ success: false, msg: expect.any(String) }));
      // Missing 'notes' (but still ok as it is not required)
      let { notes, ...testData3 } = transactionData;
      await request(app).post("/").set("Cookie", jwt).send(testData3).expect(200);

      // Invalid price
      res = await request(app).post("/").set("Cookie", jwt).send({ ...transactionData, price: "invalid value" }).expect(422);
      expect(res.body).toEqual(expect.objectContaining({ success: false, msg: expect.any(String) }));
      res = await request(app).post("/").set("Cookie", jwt).send({ ...transactionData, price: "-98" }).expect(422);
      expect(res.body).toEqual(expect.objectContaining({ success: false, msg: expect.any(String) }));

      // Invalid date
      res = await request(app).post("/").set("Cookie", jwt).send({ ...transactionData, date: 999999999999999 }).expect(422);
      expect(res.body).toEqual(expect.objectContaining({ success: false, msg: expect.any(String) }));
      res = await request(app).post("/").set("Cookie", jwt).send({ ...transactionData, date: -100 }).expect(422);
      expect(res.body).toEqual(expect.objectContaining({ success: false, msg: expect.any(String) }));
    });

    it("creates and gets 2 new transactions with the same crypto", async () => {
      // Create transactions
      let res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));
      res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));

      // Get transactions
      res = await request(app).get("/").set("Cookie", jwt).expect(200);
      const data = res.body;
      expect(data.success).toBe(true);
      // Expect 1 crypto with 2 transaction
      expect(Object.keys(data.transactions).length).toBe(1);
      expect(data.transactions[transactionData.crypto].length).toBe(2);

      const { crypto, ...remaining } = transactionData;
      expect(data.transactions[transactionData.crypto][0]).toEqual(expect.objectContaining({
        ...remaining,
        _id: expect.any(String),
      }));
      
      expect(data.transactions[transactionData.crypto][1]).toEqual(expect.objectContaining({
        ...remaining,
        _id: expect.any(String),
      }));
    });

    it("creates and gets 2 new transactions with different crypto", async () => {
      const testCrypto = "testcrypto";
      // Create transactions
      let res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));
      res = await request(app).post("/").set("Cookie", jwt).send({ ...transactionData, crypto: testCrypto}).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));

      // Get transactions
      res = await request(app).get("/").set("Cookie", jwt).expect(200);
      const data = res.body;
      expect(data.success).toBe(true);
      // Expect 2 crypto, each with 1 transaction
      expect(Object.keys(data.transactions).length).toBe(2);
      expect(data.transactions[transactionData.crypto].length).toBe(1);
      expect(data.transactions[testCrypto].length).toBe(1);

      const { crypto, ...remaining } = transactionData;
      expect(data.transactions[transactionData.crypto][0]).toEqual(expect.objectContaining({
        ...remaining,
        _id: expect.any(String),
      }));
      expect(data.transactions[testCrypto][0]).toEqual(expect.objectContaining({
        ...remaining,
        _id: expect.any(String),
      }));
    });

  });

  describe("Test update transaction endpoint", () => {
    const newTransactionData = { ...transactionData, quantity: "12", price: "88" };

    it("creates and updates a transaction (same crypto)", async () => {
      // Create transaction
      let res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;
      // Update transaction
      res = await request(app).put("/").set("Cookie", jwt).send({ id, ...newTransactionData }).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, newId: expect.any(String) }));
      id = res.body.newId;

      // Get transaction
      res = await request(app).get("/").set("Cookie", jwt).expect(200);
      const data = res.body;
      expect(Object.keys(data.transactions).length).toBe(1);
      expect(data.transactions[transactionData.crypto].length).toBe(1);

      const { crypto, ...remaining } = newTransactionData;
      expect(data.transactions[crypto][0]).toEqual(expect.objectContaining({
        ...remaining,
        _id: id,
      }));
    });

    it("creates and updates a transaction (different crypto)", async () => {
      const newCrypto = "NEW_CRYPTO";
      const newTransactionData = { ...transactionData, quantity: "12", price: "88", crypto: newCrypto };

      // Create transaction
      let res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;
      // Update transaction
      res = await request(app).put("/").set("Cookie", jwt).send({ id, ...newTransactionData }).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, newId: expect.any(String) }));
      id = res.body.newId;

      // Get transaction
      res = await request(app).get("/").set("Cookie", jwt).expect(200);
      let data = res.body;
      expect(Object.keys(data.transactions).length).toBe(1);
      expect(data.transactions[newCrypto].length).toBe(1);

      const { crypto, ...remaining } = newTransactionData;
      expect(data.transactions[crypto][0]).toEqual(expect.objectContaining({
        ...remaining,
        _id: id,
      }));

      // Create another transaction with "NEW_CRYPTO"
      res = await request(app).post("/").set("Cookie", jwt).send(newTransactionData).expect(200);
      id = res.body.id;
      // Turn it back to the original transactionData
      res = await request(app).put("/").set("Cookie", jwt).send({ id, ...transactionData}).expect(200);
      // Expect 2 crypto, each with 1 transaction
      res = await request(app).get("/").set("Cookie", jwt).expect(200);
      data = res.body;

      expect(Object.keys(data.transactions).length).toBe(2);
      expect(data.transactions[transactionData.crypto].length).toBe(1);
      expect(data.transactions[newCrypto].length).toBe(1);

      // Remove 'crypto' property
      const remaining2 = Object.assign({}, transactionData);
      delete remaining2.crypto;

      expect(data.transactions[transactionData.crypto][0]).toEqual(expect.objectContaining({
        ...remaining2,
        _id: expect.any(String),
      }));
      expect(data.transactions[crypto][0]).toEqual(expect.objectContaining({
        ...remaining,
        _id: expect.any(String),
      }));
    });

    it("throws an error when the parameters are invalid", async () => {
      // Create transaction
      const invalidId = "invalid_id";
      let res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;

      // Missing crypto
      let { crypto, ...testData } = newTransactionData;
      await request(app).put("/").set("Cookie", jwt).send({ id, ...testData }).expect(400);
      // Missing price
      let { price, ...testData2 } = newTransactionData;
      await request(app).put("/").set("Cookie", jwt).send({ id, ...testData2 }).expect(400);
      // Missing id
      await request(app).put("/").set("Cookie", jwt).send(transactionData).expect(400);
      // Invalid quantity
      await request(app).put("/").set("Cookie", jwt).send({ id, ...transactionData, quantity: "-19" }).expect(422);
      // Invalid id
      await request(app).put("/").set("Cookie", jwt).send({ id: invalidId, ...transactionData }).expect(404);
    });
  });

  describe("Test delete transaction endpoint", () => {
    it("creates and deletes a transaction (and the crypto key)", async () => {
      // Create transaction
      let res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;

      await request(app).delete("/").set("Cookie", jwt).send({ id }).expect(200);

      res = await request(app).get("/").set("Cookie", jwt).expect(200);
      // Expect 0 transactions, with no crypto
      expect(res.body.transactions).toEqual({});
    });

    it("creates and deletes a transaction (but not the crypto key)", async () => {
      // Create 2 transactions
      let res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      res = await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;

      await request(app).delete("/").set("Cookie", jwt).send({ id }).expect(200);

      res = await request(app).get("/").set("Cookie", jwt).expect(200);
      const data = res.body;
      // Expect 1 crypto and 1 transaction
      expect(Object.keys(data.transactions).length).toBe(1);
      expect(data.transactions[transactionData.crypto].length).toBe(1);

      const { crypto, ...remaining } = transactionData;
      expect(data.transactions[crypto][0]).toEqual(expect.objectContaining({
        ...remaining,
        _id: expect.any(String),
      }));
    });

    it("throws an error when the id is invalid", async () => {
      const fakeId = "FAKE_ID";
      // Return error if there are no transactions
      await request(app).delete("/").set("Cookie", jwt).send({ id: fakeId }).expect(404);
      // Create transaction
      await request(app).post("/").set("Cookie", jwt).send(transactionData).expect(200);
      // Still return error
      await request(app).delete("/").set("Cookie", jwt).send({ id: fakeId }).expect(404);
      // Return error if the id is not provided
      await request(app).delete("/").set("Cookie", jwt).expect(400);
    });
  });
});
