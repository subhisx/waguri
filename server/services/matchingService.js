const filterService = require('./filterService');
const scoreCalculator = require('../utils/scoreCalculator');

function matchIssues(issues, preferences, options = {}) {
  if (!preferences || !Array.isArray(preferences.skills)) {
    throw new TypeError('Matching preferences must include a skills array.');
  }

  const scoringOptions = {
    ...options,
    now: options.now ?? Date.now(),
  };
  const matchedIssues = filterService.filterIssues(issues)
    .map((issue) => {
      const componentScores = scoreCalculator.calculateComponentScores(
        issue,
        preferences,
        scoringOptions,
      );

      return {
        ...issue,
        estimatedDifficulty: componentScores.estimatedDifficulty.level,
        difficultyExplanation: componentScores.estimatedDifficulty.explanation,
        matchedSkills: componentScores.matchedSkills,
        missingEssentialSkills: componentScores.missingEssentialSkills,
        componentScores: {
          skillCompatibility: componentScores.skillCompatibility,
          difficultyCompatibility: componentScores.difficultyCompatibility,
          freshness: componentScores.freshness,
          beginnerFriendliness: componentScores.beginnerFriendliness,
        },
        matchScore: scoreCalculator.calculateMatchScore(componentScores),
      };
    });

  matchedIssues.sort((left, right) =>
    right.matchScore - left.matchScore
    || String(left.id).localeCompare(String(right.id)));

  return matchedIssues;
}

module.exports = {
  matchIssues,
};
