/**
 * Validation rules for User Management requests
 */
function validateCreateUser(req) {
  const { name, email, password, role, interests } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return "Field 'name' is required.";
  }

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return "Valid 'email' address is required.";
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return "Field 'password' is required and must be at least 6 characters.";
  }

  if (role && !["user", "admin"].includes(role)) {
    return "Field 'role' must be either 'user' or 'admin'.";
  }

  if (interests && !Array.isArray(interests)) {
    return "Field 'interests' must be an array of strings.";
  }

  return null;
}

function validateUpdateUser(req) {
  const { name, email, role, interests, password } = req.body || {};

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return "Field 'name' cannot be empty.";
  }

  if (email !== undefined && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))) {
    return "Field 'email' must be a valid email address.";
  }

  if (role !== undefined && !["user", "admin"].includes(role)) {
    return "Field 'role' must be either 'user' or 'admin'.";
  }

  if (interests !== undefined && !Array.isArray(interests)) {
    return "Field 'interests' must be an array of strings.";
  }

  if (password !== undefined && (typeof password !== "string" || password.length < 6)) {
    return "Field 'password' must be at least 6 characters.";
  }

  return null;
}

module.exports = {
  validateCreateUser,
  validateUpdateUser,
};

