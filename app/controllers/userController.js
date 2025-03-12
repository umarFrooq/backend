const userService = require("../routes/services/userService");

// Get users
const getUsers = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  try {
    const result = await userService.getUsers(page, limit, search);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new user
const addUser = async (req, res) => {
  const { name, email, address } = req.body;

  try {
    const newUser = await userService.addUser(name, email, address);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to add user" });
  }
};

// Update a user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, address } = req.body;

  try {
    const updatedUser = await userService.updateUser(id, name, email, address);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await userService.deleteUser(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
};