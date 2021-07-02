import "../src/setup.js";
import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database/connection.js";

describe("GET /products", () => {
  it("returns status 200 for success", async () => {

    await connection.query(`
      INSERT INTO 
      products (name, price, image, category) 
      VALUES ($1, $2, $3, $4)
    `, ['Teste', '37900', '/images/16.jpg', 'Lançamentos'])  

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

beforeAll(async () => {
  await connection.query(`
    DELETE FROM products
  `)
})

afterAll(async () => {
  await connection.query(`
    DELETE FROM products
  `)
  connection.end();
});