const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const router = express.Router();

const sb = require("@supabase/supabase-js");
const createClient = sb.createClient;

const dotenv = require("dotenv");
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

/**
 * Get all books
 */
router.get("/books", async (req, res) => {
  let { data, error } = await supabase.from("books").select("*");

  if (error) {
    res.status(500);
    res.json(error);
  }

  res.json(data);
});

/**
 * Create a new book
 */
router.post("/books", async (req, res) => {

  let { data, error } = await supabase.from("books").insert(req.body).single();

  if (error) {
    res.status(500);
    res.json(error);
  }

  res.json(data);
});

/**
 * Increment likeCount for a spesific book by 1 poin
 */
 router.patch("/books/like", async (req, res) => {

  const bookId = req.body?.book_id

  let { data, error } = await supabase.rpc('increment', {book_id: bookId})

  if (error) {
    res.status(500);
    res.json(error);
  }

  res.json(data);
});

/**
 * Decrement likeCount for a spesific book by 1 poin
 */
 router.patch("/books/dislike", async (req, res) => {

  const bookId = req.body?.book_id

  let { data, error } = await supabase.rpc('decrement', {book_id: bookId})

  if (error) {
    res.status(500);
    res.json(error);
  }

  res.json(data);
});

/**
 * Get all countries
 */
router.get("/countries", async (req, res) => {
  let { data, error } = await supabase
    .from("countries")
    .select("*")
    .order("name");

  if (error) {
    res.status(500);
    res.json(error);
  }

  res.json(data);
});

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
