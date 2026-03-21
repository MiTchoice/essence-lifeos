const express = require("express");
const router  = express.Router();
const c       = require("../controllers/financeController");

router.get("/",                    c.getExpenses);
router.post("/",                   c.createExpense);
router.put("/:id",                 c.updateExpense);
router.delete("/:id",              c.deleteExpense);
router.get("/comparison/daily",    c.getDailyComparison);
router.get("/budget/monthly",      c.getBudgetStatus);

module.exports = router;
