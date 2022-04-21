import app from "../config/app";
import request from "supertest";
import mongoose from "mongoose";
import authRouter from "../routes/auth.router";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { JWT_KEY } from "../config/config";

app.use("/", authRouter);

beforeEach(async () => {
  // Delete all users
  await User.deleteMany({});
});

afterAll(async () => {
	await mongoose.connection.close();
});

describe("Test authentication system", () => {
  const email = "test@test.com";
  const password = "testpassword123";

  describe("Test register endpoint", () => {
    it("registers a user", async () => {
      const res = await request(app).post("/register").send({ email, password });
      expect(res.status).toBe(200);
      // Grab JWT token
      const cookie = res.headers["set-cookie"][0];
      const jwtToken = cookie.split("=")[1].split(";")[0];
      // Verify it
      expect(jwt.verify(jwtToken, JWT_KEY)).toEqual(expect.objectContaining({
        sub: expect.any(String),
        iat: expect.any(Number)
      }));
    });

    it("throws an error when registering two users with the same email", async () => {
      let res = await request(app).post("/register").send({ email, password });
      expect(res.status).toBe(200);

      res = await request(app).post("/register").send({ email, password });
      // Email already registered error
      expect(res.status).toBe(409);
      // Grab JWT token
      const cookie = res.headers["set-cookie"][0];
      const jwtToken = cookie.split("=")[1].split(";")[0];
      // Check if the JWT token has been unset
      expect(jwtToken).toBe("");
    });

    it("throws an error when registering a user with missing credentials", async () => {
      let res = await request(app).post("/register");
      expect(res.status).toBe(400);

      res = await request(app).post("/register").send({ email });
      expect(res.status).toBe(400);

      res = await request(app).post("/register").send({ password });
      expect(res.status).toBe(400);
    });

    it("throws an error when the email or password is invalid", async () => {
      const invalidEmail = "invalid@.com";
      const invalidPassword = "test";
      // Invalid password
      let res = await request(app).post("/register").send({ email, password: invalidPassword });
      expect(res.status).toBe(422);
      // Invalid email
      res = await request(app).post("/register").send({ email: invalidEmail, password });
      expect(res.status).toBe(422);
      // Invalid email and password
      res = await request(app).post("/register").send({ email: invalidEmail, password: invalidPassword });
      expect(res.status).toBe(422);
    });
  });

  describe("Test login endpoint", () => {
    beforeEach(async () => {
      // Save the user
      const user = new User({ email, password });
      await user.save();
    });

    it("logins a user", async () => {
      const res = await request(app).post("/login").send({ email, password });
      expect(res.status).toBe(200);
      // Grab JWT token
      const cookie = res.headers["set-cookie"][0];
      const jwtToken = cookie.split("=")[1].split(";")[0];
      // Verify it
      expect(jwt.verify(jwtToken, JWT_KEY)).toEqual(expect.objectContaining({
        sub: expect.any(String),
        iat: expect.any(Number)
      }));
    });

    it("throws an error when the credentials are wrong", async () => {
      const fakeEmail = "fak@email.com";
      const fakePassword = "fakepassword123";
      // Wrong email and password
      let res = await request(app).post("/login").send({ email: fakeEmail, password: fakePassword });
      expect(res.status).toBe(401);

      const cookie = res.headers["set-cookie"][0];
      const jwtToken = cookie.split("=")[1].split(";")[0];
      expect(jwtToken).toBe("");
      // Wrong password
      res = await request(app).post("/login").send({ email, password: fakePassword });
      expect(res.status).toBe(401);
    });
  });

  describe("Test verify endpoint", () => {
    beforeEach(async () => {
      // Save the user
      const user = new User({ email, password });
      await user.save();
    });

    it("logins and verifies a user", async () => {
      // Get JWT cookie
      let res = await request(app).post("/login").send({ email, password });
      const cookie = res.headers["set-cookie"][0];
      // Verify the JWT cookie with the endpoint
      res = await request(app).get("/verify").set("Cookie", cookie);
      expect(res.status).toBe(200);
    });

    it("throws an error when the jwt cookie is invalid", async () => {
      const fakeCookie = "jwt=fakeJWT123; Path=/; HttpOnly; Secure";
      let res = await request(app).get("/verify").set("Cookie", fakeCookie);
      expect(res.status).toBe(401);
      // Cookie missing
      res = await request(app).get("/verify");
      expect(res.status).toBe(401);
    });
  });

  describe("Test logout endpoint", () => {
    it("unsets the jwt cookie", async () => {
      // Get JWT cookie
      let res = await request(app).delete("/login");
      expect(res.status).toBe(200);
      const cookie = res.headers["set-cookie"][0];
      const jwtToken = cookie.split("=")[1].split(";")[0];
      // Check if it's empty
      expect(jwtToken).toBe("");
    });
  });
});