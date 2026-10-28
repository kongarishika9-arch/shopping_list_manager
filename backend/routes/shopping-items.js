const express = require("express");
const { validate: isUuid } = require("uuid");
const supabase = require("../config/supabase");

const router = express.Router();
const TABLE = "shopping_items";

function sendDatabaseError(res, error) {
  console.error("Supabase error:", error.message || error);
  return res.status(500).json({ error: "A database error occurred. Please try again." });
}

router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, quantity, bought, created_at")
    .order("created_at", { ascending: true });

  if (error) return sendDatabaseError(res, error);
  return res.json({ items: data || [] });
});

router.post("/", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const quantity = req.body.quantity;

  if (!name) return res.status(400).json({ error: "Item name is required." });
  if (name.length > 120) return res.status(400).json({ error: "Item name must be 120 characters or fewer." });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    return res.status(400).json({ error: "Quantity must be a whole number from 1 to 9999." });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, quantity, bought: false })
    .select("id, name, quantity, bought, created_at")
    .single();

  if (error) return sendDatabaseError(res, error);
  return res.status(201).json({ item: data });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: "Invalid item ID." });
  if (typeof req.body.bought !== "boolean") {
    return res.status(400).json({ error: "The bought field must be true or false." });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ bought: req.body.bought })
    .eq("id", id)
    .select("id, name, quantity, bought, created_at")
    .maybeSingle();

  if (error) return sendDatabaseError(res, error);
  if (!data) return res.status(404).json({ error: "Shopping item not found." });
  return res.json({ item: data });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: "Invalid item ID." });

  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return sendDatabaseError(res, error);
  if (!data) return res.status(404).json({ error: "Shopping item not found." });
  return res.status(204).send();
});

module.exports = router;
