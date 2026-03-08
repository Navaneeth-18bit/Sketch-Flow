const { auth } = require("../utils/firebaseAdmin");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    // Role is now extracted directly from Firebase custom claims
    req.user = {
      ...decodedToken,
      role: decodedToken.role || 'student'
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: "Auth error" });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = {
      ...decodedToken,
      role: decodedToken.role || 'student'
    };
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authMiddleware, optionalAuthMiddleware };