const { auth: firebaseAuth } = require("../utils/firebaseAdmin");

const setCustomRole = async (req, res, next) => {
  try {
    const { uid, role } = req.body;
    
    // Explicit validation: Role must be provided and must be one of the valid types
    if (!role) {
      return res.status(400).json({ error: "Role is required." });
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role provided. Role must be student, teacher, or admin." });
    }

    // Check if user already has a role to prevent overwriting during subsequent logins
    const user = await firebaseAuth.getUser(uid);
    if (user.customClaims && user.customClaims.role) {
      return res.json({ message: "User already has a role assigned.", role: user.customClaims.role });
    }

    await firebaseAuth.setCustomUserClaims(uid, { role });
    res.json({ message: `Custom role ${role} set for user ${uid}` });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { users } = await firebaseAuth.listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    await firebaseAuth.setCustomUserClaims(userId, { role });
    res.json({ message: `User ${userId} updated to role ${role}` });
  } catch (error) {
    next(error);
  }
};

const getApiStatus = async (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    api_version: "1.0.0",
    service: "AI-Powered Diagram Analysis API"
  });
};

module.exports = {
  getAllUsers,
  updateUserRole,
  getApiStatus,
  setCustomRole
};