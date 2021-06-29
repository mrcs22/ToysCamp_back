import express from "express";
import cors from "cors";
import connection from "./database/connection.js";
import { signUpSchema } from "./schemas/userSchemas.js";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());
app.use(express.static('public'))
app.use(cors());

app.post("/sign-up", async (req, res) => {
  try {
    const validation = signUpSchema.validate(req.body);

    if (validation.error) {
      return res.sendStatus(400);
    }

    const { name, email, password } = req.body;

    const confflictedUser = await connection.query(
      `
    SELECT * FROM users
    WHERE email = $1
    `,
      [email]
    );

    if (confflictedUser.rows.length > 0) {
      return res.sendStatus(409);
    }

    const hashedPassword = bcrypt.hashSync(password, 12);
    await connection.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1,$2,$3)
      `,
      [name, email, hashedPassword]
    );

    res.sendStatus(201);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.get("/products", async (req, res) => {
  try {
      const products = await connection.query(`
        SELECT *
        FROM products
      `)
      res.status(200).send(products.rows)

  } catch (e) {
    res.sendStatus(500)
  }
})

export default app;
