
const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    service: 'OpenSource Buddy Backend',
    message: 'Backend is running successfully!',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
