const express = require("express");
const router  = express.Router();
const c       = require("../controllers/taskController");

router.get("/",                 c.getTasks);
router.get("/stats",            c.getTaskStats);
router.post("/",                c.createTask);
router.put("/:id",              c.updateTask);
router.delete("/:id",           c.deleteTask);
router.post("/:id/prepone",     c.preponeTask);
router.post("/:id/postpone",    c.postponeTask);
router.post("/shuffle/all",     c.shuffleTasks);

module.exports = router;
