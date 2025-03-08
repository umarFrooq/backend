const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// GET /api/users
router.get("/users", userController.getUsers);

// POST /api/users
router.post("/users", userController.addUser);

// PUT /api/users/:id
router.put("/users/:id", userController.updateUser);

// DELETE /api/users/:id
router.delete("/users/:id", userController.deleteUser);

module.exports = router;