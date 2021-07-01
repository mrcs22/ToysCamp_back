import express from "express";
import cors from "cors";
import connection from "./database/connection.js";
import { signUpSchema, signInSchema } from "./schemas/userSchemas.js";
import { shopcartItemSchema } from "./schemas/shopcartSchemas.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(express.static("public"));
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
    console.log(e);
  }
});

app.post("/sign-in", async (req, res) => {
  try {
    const validation = signInSchema.validate(req.body);

    if (validation.error) {
      return res.sendStatus(400);
    }

    const { email, password } = req.body;

    const result = await connection.query(
      `
    SELECT * FROM users
    WHERE email = $1
    `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.sendStatus(401);
    }

    const user = result.rows[0];

    if (bcrypt.compareSync(password, user.password)) {
      const userData = { id: user.id };
      const jwtSecret = process.env.JWT_SECRET;
      const tokenconfig = { expiresIn: 60 * 60 * 24 * 7 };

      const token = jwt.sign(userData, jwtSecret, tokenconfig);

      return res.send({ name: user.name, token });
    } else {
      return res.sendStatus(401);
    }
  } catch (e) {
    res.sendStatus(500);
    console.log(e);
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await connection.query(`
        SELECT *
        FROM products
      `);

    res.status(200).send(products.rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.post("/shopcart", async (req, res) => {
  try {
    const validation = shopcartItemSchema.validate(req.body);
    const token = req.headers["authorization"]?.replace("Bearer ", "");

    if (validation.error) {
      return res.sendStatus(400);
    }

    const jwtSecret = process.env.JWT_SECRET;
    const customerInfo = jwt.decode(token, jwtSecret);

    if (customerInfo) {
      const customer = await connection.query(
        `
      SELECT FROM users
      WHERE id=$1
      `,
        [customerInfo.id]
      );

      if (customer.rows.length === 0) {
        res.sendStatus(401);
      }

      await connection.query(
        `
        INSERT INTO shopcart
        (user_id, product_id)
        Values ($1,$2)
        `,
        [customerInfo.id, req.body.productId]
      );
      return res.sendStatus(201);
    }

    res.sendStatus(401);
  } catch (e) {
    res.sendStatus(500);
    console.log(e);
  }
});

export default app;
