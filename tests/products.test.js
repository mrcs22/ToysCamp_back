import "../src/setup.js";
import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database/connection.js";

describe("GET /products", () => {
    it("returns status 200 for success", async () => {
        const result = await supertest(app).get("/products");
        expect(result.status).toEqual(200);
        
        expect(result.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              category: expect.any(String),
              id: expect.any(Number),
              image: expect.any(String),
              name: expect.any(String),
              price: expect.any(String)
            })
          ])
        )
      });
})

afterAll(async () => {
    connection.end();
  });