import "../src/setup.js";
import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database/connection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

describe("POST /shopcart", () => {
  beforeEach(async () => {
    await connection.query(`
  DELETE FROM users
  `);
    await connection.query(`
  DELETE FROM shopcart
  `);
  });

  it("returns status 400 for empty body", async () => {
    const result = await supertest(app).post("/shopcart").send({});
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for valid body but no token", async () => {
    const result = await supertest(app).post("/shopcart").send({ id: 1 });
    expect(result.status).toEqual(400);
  });

  it("returns status 401 for valid body and valid token but nonexistent user", async () => {
    const userId = 1;

    const jwtSecret = process.env.JWT_SECRET;
    const tokenconfig = { expiresIn: 60 * 60 * 24 };

    const token = jwt.sign({ id: userId }, jwtSecret, tokenconfig);

    const result = await supertest(app)
      .post("/shopcart")
      .send({ productId: 1 })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toEqual(401);
  });

  it("inserts new item to database when valid body and valid token", async () => {
    const result = await connection.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ('Test','test@test.com','${bcrypt.hashSync("123456", 12)}')
      RETURNING id`
    );

    const userId = result.rows[0].id;

    const beforeAddProduct = await connection.query(
      `
      SELECT * FROM shopcart
      WHERE user_id = $1
      `,
      [userId]
    );

    expect(beforeAddProduct.rows.length).toEqual(0);

    const jwtSecret = process.env.JWT_SECRET;
    const tokenconfig = { expiresIn: 60 * 60 * 24 };

    const token = jwt.sign({ id: userId }, jwtSecret, tokenconfig);

    await supertest(app)
      .post("/shopcart")
      .send({ productId: 1 })
      .set("Authorization", `Bearer ${token}`);

    const afterAddProduct = await connection.query(
      `
      SELECT * FROM shopcart
      WHERE user_id = $1
      `,
      [userId]
    );

    expect(afterAddProduct.rows.length).toEqual(1);
  });
});

afterAll(async () => {
  await connection.query(`
  DELETE FROM users
  `);

  await connection.query(`
  DELETE FROM shopcart
  `);

  connection.end();
});
