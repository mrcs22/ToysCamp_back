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
    await connection.query(`
  DELETE FROM products
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

describe("GET /shopcart", () => {
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
  });

  it("returns status 401 for no token", async () => {
    const result = await supertest(app).get("/shopcart");
    expect(result.status).toEqual(401);
  });

  it("returns status 401 for valid token but nonexistent user", async () => {
    const userId = 1;

    const jwtSecret = process.env.JWT_SECRET;
    const tokenconfig = { expiresIn: 60 * 60 * 24 };

    const token = jwt.sign({ id: userId }, jwtSecret, tokenconfig);

    const result = await supertest(app)
      .get("/shopcart")
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toEqual(401);
  });

  it("returns correct data for valid token", async () => {
    const userResult = await connection.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ('Test','test@test.com','${bcrypt.hashSync("123456", 12)}')
      RETURNING id`
    );

    const userId = userResult.rows[0].id;

    const productResult = await connection.query(`
    INSERT INTO products
    (name, price, image, category)
    VALUES ('testToy',99999,'https://','test')
    RETURNING id
    `);

    const productId = productResult.rows[0].id;

    await connection.query(
      `
      INSERT INTO shopcart
      (user_id,product_id)
      VALUES ($1,$2)
      `,
      [userId, productId]
    );

    const jwtSecret = process.env.JWT_SECRET;
    const tokenconfig = { expiresIn: 60 * 60 * 24 };

    const token = jwt.sign({ id: userId }, jwtSecret, tokenconfig);

    const response = await supertest(app)
      .get("/shopcart")
      .set("Authorization", `Bearer ${token}`);

    expect(JSON.parse(response.text)).toEqual([
      {
        id: productId,
        name: "testToy",
        price: 99999,
        image: "https://",
        category: "test",
        count: 1,
      },
    ]);
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
  connection.end();
});
