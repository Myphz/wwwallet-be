import app from "../config/app.js";
import request from "supertest";
import mongoose from "mongoose";
import authRouter from "../routes/auth.router.js";
import User from "../models/user";
import { issueJWT, decodeJWT } from "../helpers/jwt.helper.js";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;
app.use("/", authRouter);
const req = request(app);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri())
}, 120000);

beforeEach(async () => {
  // Delete all users
  await User.deleteMany({});
});

afterAll(async () => {
	await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Test authentication system", () => {
  const email = "test@test.com";
  const password = "testpassword123";

  describe("Test register endpoint", () => {
    it("registers a user", async () => {
      const res = await req.post("/register").send({ email, password });
      expect(res.status).toBe(200);
      // Expect the headers not to contain any jwt cookie as the user is not verified
      expect(res.headers).not.toHaveProperty("set-cookie");
      // Get the user from database and expect the isVerified field to be false
      expect((await User.findOne({})).isVerified).toBe(false);
    });

    it("throws an error when registering two users with the same email", async () => {
      let res = await req.post("/register").send({ email, password });
      expect(res.status).toBe(200);

      res = await req.post("/register").send({ email, password });
      // Email already registered error
      expect(res.status).toBe(409);
    });

    it("throws an error when registering a user with missing credentials", async () => {
      let res = await req.post("/register");
      expect(res.status).toBe(400);

      res = await req.post("/register").send({ email });
      expect(res.status).toBe(400);

      res = await req.post("/register").send({ password });
      expect(res.status).toBe(400);
    });

    it("throws an error when the email or password is invalid", async () => {
      const invalidEmail = "invalid@.com";
      const invalidPassword = "test";
      // Invalid password
      let res = await req.post("/register").send({ email, password: invalidPassword });
      expect(res.status).toBe(422);
      // Invalid email
      res = await req.post("/register").send({ email: invalidEmail, password });
      expect(res.status).toBe(422);
      // Invalid email and password
      res = await req.post("/register").send({ email: invalidEmail, password: invalidPassword });
      expect(res.status).toBe(422);
    });

    it("resends the email", async () => {
      await req.post("/register").send({ email, password }).expect(200);
      const res = await req.post("/register").send({ email, password, resend: true }).expect(200);
      expect(res.status).toBe(200);
      // Expect the headers not to contain any jwt cookie as the user is not verified
      expect(res.headers).not.toHaveProperty("set-cookie");
    });

    it("throws an error if trying to resend the email with invalid email or password", async () => {
      const fakeEmail = "fak@email.com";
      const fakePassword = "fakepassword123";

      await req.post("/register").send({ email, password }).expect(200);
      // Wrong email
      await req.post("/register").send({ email: fakeEmail, password, resend: true }).expect(401);
      // Wrong password
      await req.post("/register").send({ email, password: fakePassword, resend: true }).expect(401);
      // Both wrong
      await req.post("/register").send({ email: fakeEmail, password: fakePassword, resend: true }).expect(401);
    });

    it("throws an error if trying to resend the email with an already verified account", async () => {
      // Manually create verified account
      await new User({ email, password, isVerified: true }).save();
      await req.post("/register").send({ email, password, resend: true }).expect(401);
    });
  });

  describe("Test register verify email endpoint", () => {
    it("registers and verifies a user", async () => {
      await req.post("/register").send({ email, password }).expect(200);
      // Grab user from database
      const user = await User.findOne({});
      // Create jwt token
      const jwt = issueJWT(user);
      // Call method to verify the user
      const res = await req.post("/register/verify").send({ jwt }).expect(200);
      // Get jwt cookie
      const jwtToken = res.headers["set-cookie"][0].split("=")[1].split(";")[0];
      // Verify it
      expect(decodeJWT(jwtToken)).toEqual(expect.objectContaining({
        sub: expect.any(String),
        iat: expect.any(Number)
      }));
      // Check that the user has been verified
      expect((await User.findOne({})).isVerified).toBe(true);
    });

    it("throws error if the jwt is not valid", async () => {
      await req.post("/register").send({ email, password }).expect(200);
      // Create fake jwt
      const jwt = "fakejwt123";
      // Call method to verify the user
      await req.post("/register/verify").send({ jwt }).expect(401);
    });

    it("throws error if the jwt is missing", async () => {
      await req.post("/register/verify").expect(400);
      await req.post("/register/verify").send({ jwt: 123 }).expect(422);
    });
  });

  describe("Test login endpoint", () => {
    beforeEach(async () => {
      // Save the user
      const user = new User({ email, password });
      await user.save();
    });

    it("logins a verified user", async () => {
      // Create JWT token and verify user
      let jwt = issueJWT((await User.findOne({})));
      await req.post("/register/verify").send({ jwt }).expect(200);
      // Send login request
      const res = await req.post("/login").send({ email, password }).expect(200);
      expect(res.body.isVerified).toBe(true);
      // Grab the issued JWT token
      const cookie = res.headers["set-cookie"][0];
      jwt = cookie.split("=")[1].split(";")[0];
      // Verify it
      expect(decodeJWT(jwt)).toEqual(expect.objectContaining({
        sub: expect.any(String),
        iat: expect.any(Number)
      }));
    });

    it("doesn't set the JWT cookie if the user is not verified", async () => {
      // Send login request
      const res = await req.post("/login").send({ email, password }).expect(200);
      expect(res.body.isVerified).toBe(false);
      // Grab the response not to have the jwt token
      expect(res.headers).not.toHaveProperty("set-cookie");
    });

    it("throws an error when the credentials are wrong", async () => {
      const fakeEmail = "fak@email.com";
      const fakePassword = "fakepassword123";
      // Wrong email and password
      let res = await req.post("/login").send({ email: fakeEmail, password: fakePassword });
      expect(res.status).toBe(401);
      // Check that the jwt cookie has been unset
      const cookie = res.headers["set-cookie"][0];
      const jwtToken = cookie.split("=")[1].split(";")[0];
      expect(jwtToken).toBe("");
      // Wrong password
      res = await req.post("/login").send({ email, password: fakePassword });
      expect(res.status).toBe(401);
      // Wrong email
      res = await req.post("/login").send({ email: fakeEmail, password });
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
      // Create JWT token and verify user
      const jwt = issueJWT((await User.findOne({})));
      const res = await req.post("/register/verify").send({ jwt }).expect(200);
      // Grab cookie
      const cookie = res.headers["set-cookie"][0];
      // Verify the JWT cookie with the endpoint
      await req.get("/verify").set("Cookie", cookie).expect(200);
    });

    it("throws an error when the user is not verified", async () => {
      // Create JWT token but don't verify user
      const jwt = issueJWT((await User.findOne({})));
      // Create cookie
      const cookie = `jwt=${jwt}`
      // Verify the JWT cookie with the endpoint
      await req.get("/verify").set("Cookie", cookie).expect(401);
    });

    it("throws an error when the jwt cookie is invalid", async () => {
      const fakeCookie = "jwt=fakeJWT123;";
      await req.get("/verify").set("Cookie", fakeCookie).expect(401);
      // Cookie missing
      await req.get("/verify").expect(401);
    });
  });

  describe("Test logout endpoint", () => {
    it("unsets the jwt cookie", async () => {
      // Get JWT cookie
      let res = await req.delete("/login");
      expect(res.status).toBe(200);
      const cookie = res.headers["set-cookie"][0];
      const jwtToken = cookie.split("=")[1].split(";")[0];
      // Check if it's empty
      expect(jwtToken).toBe("");
    });
  });
});