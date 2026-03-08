const express = require("express");
const router = express.Router();
const { getAllUsers, updateUserRole, getApiStatus, setCustomRole } = require("../controllers/adminController");
const { authMiddleware } = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Public-ish route for initial registration (or protected by some logic)
router.post("/set-initial-role", setCustomRole);

// All admin routes are protected by authMiddleware and checkRole(['admin'])
router.use(authMiddleware);
router.use(checkRole(['admin']));

router.get("/users", getAllUsers);
router.post("/update-role", updateUserRole);
router.get("/status", getApiStatus);

module.exports = router;