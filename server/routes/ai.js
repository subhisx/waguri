const express = require('express');

const aiService = require('../services/aiService');

const router = express.Router();

function validateInput(validation) {
  try {
    validation();
  } catch (error) {
    if (error instanceof TypeError) {
      error.statusCode = 400;
    }
    throw error;
  }
}

router.post('/explain', async (req, res) => {
  validateInput(() => aiService.validateExplanationInput(req.body));
  const explanation = await aiService.explainIssue(req.body);

  res.status(200).json({
    success: true,
    explanation,
  });
});

router.post('/roadmap', async (req, res) => {
  validateInput(() => aiService.validateRoadmapInput(req.body));
  const roadmap = await aiService.generateRoadmap(req.body);

  res.status(200).json({
    success: true,
    roadmap,
  });
});

module.exports = router;
