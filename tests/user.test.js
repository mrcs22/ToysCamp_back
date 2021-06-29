import "../src/setup.js";
import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database/connection.js";

describe("POST /sign-up", () => {
  beforeEach(async () => {
    await connection.query(`
  DELETE FROM users
  `);
  });

  const validBody = {
    name: "teste",
    email: "teste@teste.com",
    password: "123456",
  };

  it("returns status 400 for empty body", async () => {
    const result = await supertest(app).post("/sign-up").send({});
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for no name", async () => {
    const result = await supertest(app).post("/sign-up").send({
      email: "teste@teste.com",
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for name with less than 3 letters", async () => {
    const result = await supertest(app).post("/sign-up").send({
      name: "te",
      email: "teste@teste.com",
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for empty email", async () => {
    const result = await supertest(app).post("/sign-up").send({
      name: "teste",
      password: "123456",
    });
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for invalid email", async () => {
    const result = await supertest(app).post("/sign-up").send({
      name: "te",
      email: "testeteste.com",
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
    WHERE email = 'teste@teste.com'
    `);

    expect(beforeSignUp.rows.length).toEqual(0);

    await supertest(app).post("/sign-up").send(validBody);

    const afterSignUp = await connection.query(`
    SELECT * FROM users
    WHERE email = 'teste@teste.com'
    `);

    expect(afterSignUp.rows.length).toEqual(1);
  });

  it("returns status 409 for valid body but confflicted email", async () => {
    await supertest(app).post("/sign-up").send(validBody);
    const result = await supertest(app).post("/sign-up").send(validBody);

    expect(result.status).toEqual(409);
  });
});

afterAll(async () => {
  await connection.query(`
  DELETE FROM users
  `);
  connection.end();
});
