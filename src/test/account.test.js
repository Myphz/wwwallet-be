import app from "../config/app.js";
import request from "supertest";
import mongoose from "mongoose";
import accountRouter from "../routers/account.router.js";
import User from "../models/user";
import { issueJWT } from "../helpers/jwt.helper.js";
import { encrypt } from "../helpers/crypto.helper.js";

app.use("/", accountRouter);
const req = request(app);
let user;

afterAll(async () => {
	await mongoose.connection.close();
  await global.mongoServer.stop();
});

describe("Test account management system", () => {
  const email = "test@test.com";
  const password = "testpassword123";

  beforeEach(async () => {
    // Save the verified user
    user = new User({ email, password, isVerified: true });
    await user.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("Test delete endpoint", () => {
    it("deletes the account", async () => {
      const jwt = issueJWT(user, { delete: true });
      await req.delete(`/delete?jwt=${jwt}`).expect(200);
      expect((await User.find()).length).toBe(0);
    });

    it("doesn't delete the account if the jwt is invalid or missing", async () => {
      // No "delete: true" value
      let jwt = issueJWT(user);
      await req.delete(`/delete?jwt=${jwt}`).expect(401);
      // Invalid jwt
      jwt = "fakejwt123"
      await req.delete(`/delete?jwt=${jwt}`).expect(401);
      // Missing jwt
      await req.delete(`/delete`).expect(400);
    });
  });

  describe("Test update endpoint", () => {
    it("updates the account's password", async () => {
      const newPassword = "newPassword123";

      const jwt = issueJWT(user, { update: true });
      await req.put("/update").send({ jwt, password: newPassword }).expect(200);

      const { login } = await User.checkLogin(email, newPassword);
      expect(login).toBe(true);
    });

    it("updates the account's email", async () => {
      const newEmail = "newmail@test.com";

      const jwt = issueJWT(user, { update: true, email: encrypt(newEmail) });
      await req.put("/update").send({ jwt }).expect(200);

      const { login } = await User.checkLogin(newEmail, password);
      expect(login).toBe(true);
    });

    it("updates the account's password and email", async () => {
      const newPassword = "newPassword123";
      const newEmail = "newmail@test.com";

      const jwt = issueJWT(user, { update: true, email: encrypt(newEmail) });
      await req.put("/update").send({ jwt, password: newPassword }).expect(200);

      const { login } = await User.checkLogin(newEmail, newPassword);
      expect(login).toBe(true);
    });

    it("doesn't update the account if the jwt is invalid or missing", async () => {
      const newPassword = "newPassword123";
      // No "update: true"
      let jwt = issueJWT(user);
      await req.put("/update").send({ jwt, password: newPassword }).expect(401);
      // No jwt
      await req.put("/update").expect(401);
      // Invalid jwt
      await req.put("/update").send({ jwt: "fakejwt123" }).expect(401);
      // Invalid password
      jwt = issueJWT(user, { update: true });
      await req.put("/update").send({ jwt, password: "123" }).expect(422);
    });

    it("doesn't update the account if the new email already exists", async () => {
      const newEmail = "newmail@test.com";
      // Create user with same email
      const user2 = new User({ email: newEmail, password, isVerified: true });
      await user2.save();
      // Expect conflict
      const jwt = issueJWT(user, { update: true, email: encrypt(newEmail) });
      await req.put("/update").send({ jwt }).expect(409);
    });

    it("doesn't update the account if the new email is in the wrong format (not encrypted)", async () => {
      const newEmail = "newmail@test.com";
      const jwt = issueJWT(user, { update: true, email: newEmail });
      await req.put("/update").send({ jwt }).expect(422);
    });

    it("doesn't update the account if the parameters are in the wrong type", async () => {
      let jwt = issueJWT(user, { update: true, email: 123 });
      await req.put("/update").send({ jwt }).expect(422);

      jwt = issueJWT(user, { email: encrypt("newmail@mail.com"), update: true });
      await req.put("/update").send({ jwt, password: 177 }).expect(422);
    });

    it("doesn't update the account if the user is not verified", async () => {
      const newEmail = "newmail@test.com";
      const newEmail2 = "newmail2@test.com";
      // Create user with same email
      const user2 = new User({ email: newEmail, password, isVerified: false });
      await user2.save();

      const jwt = issueJWT(user2, { update: true, email: encrypt(newEmail2) });
      await req.put("/update").send({ jwt }).expect(401);
    });
  });

  describe("Test delete transactions endpoint", () => {
    let user;
    beforeEach(async () => {
      await User.deleteMany({});
      user = new User({ email, password, isVerified: true, transactions: {
        "BTC": [
          {
            base: "USD",
            isBuy: true,
            price: 128,
            quantity: 2,
            date: 123
          },
          {
            base: "USD",
            isBuy: true,
            price: 128,
            quantity: 2,
            date: 123
          }
        ]
      }});
      await user.save();
    });

    it("deletes all user transactions", async () => {
      const jwt = `jwt=${issueJWT(user)}`;
      await req.delete("/delete/transactions").set("Cookie", jwt).expect(200);
      expect(Object.keys((await User.findOne({})).transactions).length).toBe(0);
    });

    it("doesn't delete all user transactions if the jwt is invalid or missing", async () => {
      const jwt = `jwt=fakejwt123`;
      await req.delete("/delete/transactions").set("Cookie", jwt).expect(401);
      await req.delete("/delete/transactions").expect(401);
    });
  });
});