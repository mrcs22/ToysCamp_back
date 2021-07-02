import "../src/setup.js";
import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database/connection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

describe("POST /confirm-order", () => {
    beforeEach(async () => {
      await connection.query(`
    DELETE FROM users
    `);
      await connection.query(`
    DELETE FROM shopcart
    `);
      await connection.query(`
    DELETE FROM products
    `);
      await connection.query(`
    DELETE FROM payment_info
    `);
    });
  
    it("returns status 401 for no token", async () => {
      const result = await supertest(app).post("/confirm-order");
      expect(result.status).toEqual(401);
    });
  
    it("returns status 401 for valid token and valid body but nonexistent user", async () => {
      const userId = 1;
  
      const jwtSecret = process.env.JWT_SECRET;
      const tokenConfig = { expiresIn: 60 * 60 * 24 };
  
      const token = jwt.sign({ id: userId }, jwtSecret, tokenConfig);
  
      const result = await supertest(app)
        .post("/confirm-order")
        .send({cpf: "12345678900", paymentMethod: "boleto"})
        .set("Authorization", `Bearer ${token}`);
  
      expect(result.status).toEqual(401);
    });
  
    it("returns status 400 for valid token but invalid body", async () => {
      const userResult = await connection.query(`
        INSERT INTO users (name, email, password)
        VALUES ('Test','test@test.com','${bcrypt.hashSync("123456", 12)}')
        RETURNING id`
      );
  
      const userId = userResult.rows[0].id;
  
      const productResult = await connection.query(`
        INSERT INTO products
        (name, price, image, category)
        VALUES ('testToy','99999','https://','test')
        RETURNING id
      `);
  
      const productId = productResult.rows[0].id;
  
      await connection.query(`
        INSERT INTO shopcart
        (user_id, product_id)
        VALUES ($1, $2)
        `,[userId, productId]
      );
  
      const jwtSecret = process.env.JWT_SECRET;
      const tokenConfig = { expiresIn: 60 * 60 * 24 };
  
      const token = jwt.sign({ id: userId }, jwtSecret, tokenConfig);
  
      const result = await supertest(app)
        .post("/confirm-order")
        .set("Authorization", `Bearer ${token}`);
  
      expect(result.status).toEqual(400);
    });

    it("returns status 200 for valid token and body", async () => {
      const userResult = await connection.query(`
        INSERT INTO users (name, email, password)
        VALUES ('Test','test@test.com','${bcrypt.hashSync("123456", 12)}')
        RETURNING id`
      );
  
      const userId = userResult.rows[0].id;
  
      const productResult = await connection.query(`
        INSERT INTO products
        (name, price, image, category)
        VALUES ('testToy','99999','https://','test')
        RETURNING id
      `);
  
      const productId = productResult.rows[0].id;
  
      await connection.query(`
        INSERT INTO shopcart
        (user_id, product_id)
        VALUES ($1, $2)
        `,[userId, productId]
      );
  
      const jwtSecret = process.env.JWT_SECRET;
      const tokenConfig = { expiresIn: 60 * 60 * 24 };
  
      const token = jwt.sign({ id: userId }, jwtSecret, tokenConfig);
  
      const result = await supertest(app)
        .post("/confirm-order")
        .send({cpf: "12345678900", paymentMethod: "boleto"})
        .set("Authorization", `Bearer ${token}`);
  
      expect(result.status).toEqual(200);
    });
  });

  afterAll(async () => {
    await connection.query(`
    DELETE FROM users
    `);
    await connection.query(`
    DELETE FROM shopcart
    `);
    await connection.query(`
    DELETE FROM products
    `);
    await connection.query(`
    DELETE FROM payment_info
    `);
    connection.end();
  });