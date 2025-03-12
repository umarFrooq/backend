const User = require("../../models/user");

// Fetch users with pagination and filtering
const getUsers = async (page = 1, limit = 3, search = "") => {
  const startIndex = (page - 1) * limit;

  // Build the query for filtering
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } }, // Case-insensitive search by name
          { email: { $regex: search, $options: "i" } }, // Case-insensitive search by email
          { address: { $regex: search, $options: "i" } }, // Case-insensitive search by address
        ],
      }
    : {};

  // Fetch total count of filtered users
  const totalUsers = await User.countDocuments(query);

  // Fetch paginated and filtered users
  const users = await User.find(query)
    .skip(startIndex)
    .limit(parseInt(limit));

  return {
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: parseInt(page),
    users,
  };
};

// Add a new user
const addUser = async (name, email, address) => {
  const newUser = new User({ name, email, address });
  await newUser.save();
  return newUser;
};

// Update a user
const updateUser = async (id, name, email, address) => {
  const user = await User.findByIdAndUpdate(
    id,
    { name, email, address },
    { new: true }
  );
  return user;
};

// Delete a user
const deleteUser = async (id) => {
  await User.findByIdAndDelete(id);
};

module.exports = {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
};