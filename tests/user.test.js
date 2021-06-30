import "../src/setup.js";
import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database/connection.js";
import bcrypt from "bcrypt";

describe("POST /sign-up", () => {
  beforeEach(async () => {
    await connection.query(`
  DELETE FROM users
  `);
  });

  const validBody = {
    name: "test",
    email: "test@test.com",
    password: "123456",
  };

  it("returns status 400 for empty body", async () => {
    const result = await supertest(app).post("/sign-up").send({});
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for no name", async () => {
    const result = await supertest(app).post("/sign-up").send({
      email: "test@test.com",
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for name with less than 3 letters", async () => {
    const result = await supertest(app).post("/sign-up").send({
      name: "te",
      email: "test@test.com",
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for empty email", async () => {
    const result = await supertest(app).post("/sign-up").send({
      name: "test",
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for invalid email", async () => {
    const result = await supertest(app).post("/sign-up").send({
      name: "te",
      email: "testtest.com",
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 201 for valid body", async () => {
    const result = await supertest(app).post("/sign-up").send(validBody);
    expect(result.status).toEqual(201);
  });

  it("inserts new user to database when valid body", async () => {
    const beforeSignUp = await connection.query(`
    SELECT * FROM users
    WHERE email = 'test@test.com'
    `);

    expect(beforeSignUp.rows.length).toEqual(0);

    await supertest(app).post("/sign-up").send(validBody);

    const afterSignUp = await connection.query(`
    SELECT * FROM users
    WHERE email = 'test@test.com'
    `);

    expect(afterSignUp.rows.length).toEqual(1);
  });

  it("returns status 409 for valid body but confflicted email", async () => {
    await supertest(app).post("/sign-up").send(validBody);
    const result = await supertest(app).post("/sign-up").send(validBody);

    expect(result.status).toEqual(409);
  });
});

describe("POST /sign-in", () => {
  beforeAll(async () => {
    await connection.query(`
  DELETE FROM users
  `);

    await connection.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ('Test','test@test.com','${bcrypt.hashSync("123456", 12)}')
      `
    );
  });

  const validBody = {
    email: "test@test.com",
    password: "123456",
  };

  it("returns status 400 for empty body", async () => {
    const result = await supertest(app).post("/sign-in").send({});
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for empty email", async () => {
    const result = await supertest(app).post("/sign-in").send({
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for invalid email", async () => {
    const result = await supertest(app).post("/sign-in").send({
      email: "testtest.com",
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 401 for valid email but wrong password", async () => {
    const InvalidPasswordBody = {
      email: "test@test.com",
      password: "1234567",
    };
    await supertest(app).post("/sign-in").send(validBody);
    const result = await supertest(app)
      .post("/sign-in")
      .send(InvalidPasswordBody);

    expect(result.status).toEqual(401);
  });

  it("returns status 401 for invalid email but right password", async () => {
    const InvalidPasswordBody = {
      email: "test@test.com",
      password: "1234567",
    };
    await supertest(app).post("/sign-in").send(validBody);
    const result = await supertest(app)
      .post("/sign-in")
      .send(InvalidPasswordBody);

    expect(result.status).toEqual(401);
  });

  it("returns status 200 for valid email and password", async () => {
    const result = await supertest(app).post("/sign-in").send(validBody);
    expect(result.status).toEqual(200);
  });

  it("returns the correct user name for valid email and password", async () => {
    const result = await supertest(app).post("/sign-in").send(validBody);
    const resultData = JSON.parse(result.text);
    expect(resultData.name).toEqual("Test");
  });
});

afterAll(async () => {
  await connection.query(`
  DELETE FROM users
  `);
  connection.end();
});
