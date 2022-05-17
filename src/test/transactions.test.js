import app from "../config/app.js";
import request from "supertest";
import mongoose from "mongoose";
import User from "../models/user";
import transactionsRouter from "../routers/transactions.router.js";
import { issueJWT } from "../helpers/jwt.helper.js";

app.use("/", transactionsRouter);
const req = request(app);

afterAll(async () => {
  await User.deleteMany({});
	await mongoose.connection.close();
  await global.mongoServer.stop();
});

describe("Test transactions system", () => {
  const email = "testemail@email.com";
  const password = "testpassword12";
  const transactionData =  { crypto: "BTC", base: "USDC", isBuy: true, price: "24323.2342", quantity: "1.430000002", date: 332412223, notes: "test notes" };
  let jwt;

  beforeEach(async () => {
    await User.deleteMany({});
    // Save the user and get jwt token
    const user = await new User({ email, password, isVerified: true }).save()
    jwt = `jwt=${issueJWT(user)};`;
  });

  describe("Test create & get transaction endpoint", () => {
    it("creates and gets a new transaction", async () => {
      // Create transaction
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));
      // Get transactions
      res = await req.get("/").set("Cookie", jwt).expect(200);
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
      await req.post("/").set("Cookie", jwt).send(testData).expect(400);
      // Missing 'quantity'
      let { quantity, ...testData2 } = transactionData;
      await req.post("/").set("Cookie", jwt).send(testData2).expect(400);
      // Missing 'notes' (but still ok as it is not required)
      let { notes, ...testData3 } = transactionData;
      await req.post("/").set("Cookie", jwt).send(testData3).expect(200);

      // Invalid price
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, price: "invalid value" }).expect(422);
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, price: "-98" }).expect(422);

      // Invalid date
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, date: 999999999999999 }).expect(422);
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, date: -100 }).expect(422);
    });

    it("creates and gets 2 new transactions with the same crypto", async () => {
      // Create transactions
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));
      res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));

      // Get transactions
      res = await req.get("/").set("Cookie", jwt).expect(200);
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
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));
      res = await req.post("/").set("Cookie", jwt).send({ ...transactionData, crypto: testCrypto}).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, id: expect.any(String) }));

      // Get transactions
      res = await req.get("/").set("Cookie", jwt).expect(200);
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

    it("creates 2 transactions buy & sell", async () => {
      // Send BUY transaction
      await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      // Send SELL transaction with same amount (so the total is 0)
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, isBuy: false }).expect(200);
    });

    it("throws error when the balance is insufficient", async () => {
      const preciseQuantity = "1.0000000000000000000001";
      const preciseQuantityBigger = "1.00000000000000000000011";
      // Create BUY transaction
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantity }).expect(200);
      // Create SELL transaction with 0.00000000000000000000001 more (should fail as the balance can't be negative, you can't sell more than you have)
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantityBigger, isBuy: false }).expect(422);
    });

    it("throws error when the balance is insufficient in the past", async () => {
      const preciseQuantity = "1.0000000000000000000001";
      // Create BUY transaction
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantity }).expect(200);
      // Create SELL transaction with a timestamp < the buy transaction (should fail as the balance can't be negative in the past, you can't sell more than you have)
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantity, isBuy: false, date: 1 }).expect(422);
    });

    it("throws error if the value >= 1000B or < 0.00001", async () => {
      let quantity = "999999999999999999999999999999999";
      let price = "999999999999999999999999999999999";
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity, price }).expect(422);

      quantity = "0.00000001";
      price = "0.00000001";
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity, price }).expect(422);

    });
  });

  describe("Test update transaction endpoint", () => {
    const newTransactionData = { ...transactionData, quantity: "12", price: "88" };

    it("creates and updates a transaction (same crypto)", async () => {
      // Create transaction
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;
      // Update transaction
      res = await req.put("/").set("Cookie", jwt).send({ id, ...newTransactionData }).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, newId: expect.any(String) }));
      id = res.body.newId;

      // Get transaction
      res = await req.get("/").set("Cookie", jwt).expect(200);
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
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;
      // Update transaction
      res = await req.put("/").set("Cookie", jwt).send({ id, ...newTransactionData }).expect(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, newId: expect.any(String) }));
      id = res.body.newId;

      // Get transaction
      res = await req.get("/").set("Cookie", jwt).expect(200);
      let data = res.body;
      expect(Object.keys(data.transactions).length).toBe(1);
      expect(data.transactions[newCrypto].length).toBe(1);

      const { crypto, ...remaining } = newTransactionData;
      expect(data.transactions[crypto][0]).toEqual(expect.objectContaining({
        ...remaining,
        _id: id,
      }));

      // Create another transaction with "NEW_CRYPTO"
      res = await req.post("/").set("Cookie", jwt).send(newTransactionData).expect(200);
      id = res.body.id;
      // Turn it back to the original transactionData
      res = await req.put("/").set("Cookie", jwt).send({ id, ...transactionData}).expect(200);
      // Expect 2 crypto, each with 1 transaction
      res = await req.get("/").set("Cookie", jwt).expect(200);
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
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;

      // Missing crypto
      let { crypto, ...testData } = newTransactionData;
      await req.put("/").set("Cookie", jwt).send({ id, ...testData }).expect(400);
      // Missing price
      let { price, ...testData2 } = newTransactionData;
      await req.put("/").set("Cookie", jwt).send({ id, ...testData2 }).expect(400);
      // Missing id
      await req.put("/").set("Cookie", jwt).send(transactionData).expect(400);
      // Invalid quantity
      await req.put("/").set("Cookie", jwt).send({ id, ...transactionData, quantity: "-19" }).expect(422);
      // Invalid id
      await req.put("/").set("Cookie", jwt).send({ id: invalidId, ...transactionData }).expect(404);
    });

    it("updates 2 transactions buy & sell", async () => {
      const newCrypto = "NEW_CRYPTO";
      const preciseQuantity = "1.0000000000000000000001";
      // Send BUY transaction with different crypto
      let res = await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantity }).expect(200);
      let { id } = res.body;
      // Switch its crypto
      await req.put("/").set("Cookie", jwt).send({ id, ...transactionData, crypto: newCrypto }).expect(200);

      // Create random BUY transaction
      res = await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantity }).expect(200);
      id = res.body.id;
      // Switch its crypto and side
      await req.put("/").set("Cookie", jwt).send({ id, ...transactionData, crypto: newCrypto, isBuy: false }).expect(200);
    });

    it("throws error when the balance is insufficient", async () => {
      const preciseQuantity = "1.0000000000000000000001";
      const preciseQuantityBigger = "1.00000000000000000000011";
      const newCrypto = "NEW_CRYPTO";
      // Create BUY transaction with NEW CRYPTO
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantity, crypto: newCrypto }).expect(200);
      // Create BUY transaction with different crypto
      let res = await req.post("/").set("Cookie", jwt).send({ ...transactionData }).expect(200);
      let { id } = res.body;
      // Switch quantity, crypto and side (throws error as preciseQuantityBigger > preciseQuantity)
      await req.put("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantityBigger, crypto: newCrypto, isBuy: false, id }).expect(422);
      // Switch quantity, crypto and side (doesn't throw error as the quantities are now equal, so the total is 0)
      await req.put("/").set("Cookie", jwt).send({ ...transactionData, quantity: preciseQuantity, crypto: newCrypto, isBuy: false, id }).expect(200);
    });

    it("throws error when the crypto is switched and the new balance is insufficient", async () => {
      const newCrypto = "NEW_CRYPTO";
      // Create BUY transaction
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      const { id } = res.body;
      // Create SELL transaction
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, isBuy: false }).expect(200);

      // Try to modify the original BUY transaction crypto
      await req.put("/").set("Cookie", jwt).send({ ...transactionData, id, crypto: newCrypto }).expect(422);
    });
  });

  describe("Test delete transaction endpoint", () => {
    it("creates and deletes a transaction (and the crypto key)", async () => {
      // Create transaction
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;

      await req.delete("/").set("Cookie", jwt).send({ id }).expect(200);

      res = await req.get("/").set("Cookie", jwt).expect(200);
      // Expect 0 transactions, with no crypto
      expect(res.body.transactions).toEqual({});
    });

    it("creates and deletes a transaction (but not the crypto key)", async () => {
      // Create 2 transactions
      let res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      let { id } = res.body;

      await req.delete("/").set("Cookie", jwt).send({ id }).expect(200);

      res = await req.get("/").set("Cookie", jwt).expect(200);
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
      await req.delete("/").set("Cookie", jwt).send({ id: fakeId }).expect(404);
      // Create transaction
      await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      // Still return error
      await req.delete("/").set("Cookie", jwt).send({ id: fakeId }).expect(404);
      // Return error if the id is not provided
      await req.delete("/").set("Cookie", jwt).expect(400);
    });

    it("throws an error when the removed transaction leads to a negative balance", async () => {
      // Create BUY transaction
      const res = await req.post("/").set("Cookie", jwt).send(transactionData).expect(200);
      const { id } = res.body;
      // Create SELL transaction
      await req.post("/").set("Cookie", jwt).send({ ...transactionData, isBuy: false }).expect(200);
      // Return error when trying to remove the BUY transaction
      await req.delete("/").set("Cookie", jwt).send({ id }).expect(422);
    });
  });
});
