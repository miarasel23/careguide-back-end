/**
 * Validation rules for Authentication requests
 */
function validateRegister(req) {
  const { name, email, password, role, interests } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return "Field 'name' is required and must be a non-empty string.";
  }

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return "Valid 'email' address is required.";
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return "Field 'password' is required and must be at least 6 characters long.";
  }

  if (role && !["user", "admin"].includes(role)) {
    return "Field 'role' must be either 'user' or 'admin'.";
  }

  if (interests && !Array.isArray(interests)) {
    return "Field 'interests' must be an array of strings.";
  }

  return null;
}

function validateLogin(req) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return "Valid 'email' address is required.";
  }

  if (!password || typeof password !== "string") {
    return "Field 'password' is required.";
  }

  return null;
}

module.exports = {
  validateRegister,
  validateLogin,
};

