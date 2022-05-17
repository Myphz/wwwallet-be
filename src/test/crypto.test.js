import app from "../config/app.js";
import request from "supertest";
import mongoose from "mongoose";
import cryptoRouter from "../routers/crypto.router.js";
import { CRYTPO_INFO_FILE } from "../config/config.js";
import { promises as fs } from "fs";
import { jest } from "@jest/globals";

app.use("/", cryptoRouter);
const req = request(app);

afterAll(async () => {
	await mongoose.connection.close();
  await global.mongoServer.stop();
});

describe("Test crypto router", () => {
  describe("Test binance middleware", () => {
    it("fetches data from binance with the correct parameters", async () => {
      // Try to fetch the latest 10 klines from the pair BTCUSDT on the 1h interval
      const NKlines = 10;
      const testEndpoint = `klines?symbol=BTCUSDT&interval=1h&limit=${NKlines}`;

      const res = await req.get(`/binance/${testEndpoint}`).expect(200);
      expect(res.body.length).toBe(NKlines);
    });

    it("fetches data from binance with multiple slashes", async () => {
      // Try to fetch data from binance from the endpoint 'ticker/24hr'
      const testEndpoint = "ticker/24hr";

      const res = await req.get(`/binance/${testEndpoint}`).expect(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it("throws an error when the endpoint is not found", async () => {
      const fakeEndpoint = "fakeEndpoint";
      await req.get(`/binance/${fakeEndpoint}`).expect(404);
    });
  });

  describe("Test coinmarketcap middleware", () => {
    beforeEach(async () => {
      // Delete the cached file
      try {
        await fs.unlink(CRYTPO_INFO_FILE);
      } catch {};
    });

    afterAll(async () => {
      await fs.unlink(CRYTPO_INFO_FILE);
    });

    it("fetches data from coinmarketcap", async () => {
      const res = await req.get("/info").expect(200);
      
      const values = Object.values(res.body);
      // Check if all the values have name and mcap properties
      values.forEach(v => expect(v).toEqual(expect.objectContaining({
        name: expect.any(String),
        mcap: expect.any(Number)
      })));
    });

    it("fetches data from coinmarketcap and caches it", async () => {
      // Monitor the readFileSync function
      jest.spyOn(fs, "readFile");

      await req.get("/info").expect(200);
      // The first time it shouldn't have been called (due to the beforeEach hook)
      expect(fs.readFile).not.toHaveBeenCalled();

      await req.get("/info").expect(200);
      // The second time it should have been called
      expect(fs.readFile).toHaveBeenCalled();
    });

    it("doesn't fetch data from the cached file if it's outdated", async () => {
      // Create cache file
      await req.get("/info").expect(200);
      // Reset calls counter
      fs.readFile.mockClear();

      // Temporary swap the stat function to a mock function that returns 0 as the created file time
      const realFunc = fs.stat;
      fs.stat = () => ({ mtimeMs: 0 });

      await req.get("/info").expect(200);
      // It shouldn't call the readFileSync as the cached file should be regarded as outdated (dates back to 1970!!)
      expect(fs.readFile).not.toHaveBeenCalled();

      // Give back the original function
      fs.stat = realFunc;
    });
  });
});