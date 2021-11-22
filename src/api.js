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
const { getAccessToken } = require("./lib/auth");
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

/**
 * Get all books
 */
router.get("/books", async (req, res) => {
  let { data, error } = await supabase
    .from("books")
    .select(`*, user_vote (vote)`)
    .order("likeCount", { ascending: false });

  if (error) {
    res.status(500);
    res.json(error);
    return;
  }

  res.json(data);
});

/**
 * Create a new book
 */
router.post("/books", async (req, res) => {
  const accessToken = getAccessToken(req);

  if (!accessToken) {
    res.status(403);
    res.json({ error: "Not Authorized" });
    return;
  }

  let { data, error } = await supabase.from("books").insert(req.body).select(`*, user_vote (vote)`).single();

  if (error) {
    res.status(500);
    res.json(error);
    return;
  }

  res.json(data);
});

/**
 * Increment likeCount for a spesific book by 1 poin
 */
router.patch("/books/like", async (req, res) => {
  const accessToken = getAccessToken(req);

  if (!accessToken) {
    res.status(403);
    res.json({ error: "Not Authorized" });
    return;
  }

  const user = await supabase.auth.api.getUser(accessToken);
  const bookId = req.body?.book_id;
  const vote = await supabase
    .from("user_vote")
    .select("*")
    .match({ user_id: user.user.id, book: bookId })
    .single();

  if (!vote.data) {
    let { data, error } = await supabase
      .from("user_vote")
      .insert({ user_id: user.user.id, book: bookId, vote: 1 });

    if (error) {
      res.status(500);
      res.json(error);
      return;
    }
  } else {
    if (vote.data.vote >= 1) {
      res.status(500);
      res.json({ error: "Already liked the book" });
      return;
    }

    let { error } = await supabase
      .from("user_vote")
      .update({ vote: vote.data.vote + 1 })
      .match({ user_id: user.user.id, book: bookId });

    if (error) {
      res.status(500);
      res.json(error);
      return;
    }
  }

  let { data, error } = await supabase.rpc("increment", { book_id: bookId }).select(`*, user_vote (vote)`);

  if (error) {
    res.status(500);
    res.json(error);
    return;
  }

  res.json(data);
});

/**
 * Decrement likeCount for a spesific book by 1 poin
 */
router.patch("/books/dislike", async (req, res) => {
  const accessToken = getAccessToken(req);

  if (!accessToken) {
    res.status(403);
    res.json({ error: "Not Authorized" });
    return;
  }

  const user = await supabase.auth.api.getUser(accessToken);
  const bookId = req.body?.book_id;
  const vote = await supabase
    .from("user_vote")
    .select("*")
    .match({ user_id: user.user.id, book: bookId })
    .single();

  if (!vote.data) {
    let { error } = await supabase
      .from("user_vote")
      .insert({ user_id: user.user.id, book: bookId, vote: -1 });

    if (error) {
      res.status(500);
      res.json(error);
      return;
    }
  } else {
    if (vote.data.vote <= -1) {
      res.status(500);
      res.json({ error: "Already disliked the book" });
      return
    }

    let { error } = await supabase
      .from("user_vote")
      .update({ vote: vote.data.vote - 1 })
      .match({ user_id: user.user.id, book: bookId });

    if (error) {
      res.status(500);
      res.json(error);
      return;
    }
  }

  let { data, error } = await supabase.rpc("decrement", { book_id: bookId }).select(`*, user_vote (vote)`);

  if (error) {
    res.status(500);
    res.json(error);
    return;
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
