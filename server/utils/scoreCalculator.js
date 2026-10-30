const WEIGHTS = Object.freeze({
  skillCompatibility: 0.4,
  difficultyCompatibility: 0.25,
  freshness: 0.2,
  beginnerFriendliness: 0.15,
});

const REQUIRED_SKILL_CANDIDATES = [
  'Angular',
  'AWS',
  'C',
  'C#',
  'C++',
  'CSS',
  'Django',
  'Docker',
  'Go',
  'GraphQL',
  'HTML',
  'Java',
  'JavaScript',
  'Kotlin',
  'Kubernetes',
  'Node.js',
  'PHP',
  'PostgreSQL',
  'Python',
  'React',
  'Redis',
  'Ruby',
  'Rust',
  'SQL',
  'Swift',
  'TypeScript',
  'Vue',
];

const BEGINNER_LABELS = new Set([
  'beginner friendly',
  'beginner-friendly',
  'easy',
  'first timers only',
  'good first issue',
  'good-first-issue',
  'newbie',
]);

const INTERMEDIATE_LABELS = new Set([
  'intermediate',
  'medium',
]);

const ADVANCED_LABELS = new Set([
  'advanced',
  'hard',
]);

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function containsTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(
    `(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`,
    'i',
  );
  return expression.test(text);
}

function getIssueText(issue) {
  const metadata = issue.repositoryMetadata || {};
  const topics = Array.isArray(issue.repositoryTopics)
    ? issue.repositoryTopics
    : Array.isArray(metadata.topics)
      ? metadata.topics
      : [];
  const values = [
    issue.title,
    issue.description,
    ...getLabels(issue),
    issue.repository,
    issue.repositoryDescription,
    issue.repositoryLanguage,
    ...topics,
    metadata.name,
    metadata.description,
    metadata.language,
  ];

  return normalizeText(values.filter(Boolean).join(' '));
}

function getLabels(issue) {
  return (Array.isArray(issue.labels) ? issue.labels : [])
    .map((label) => normalizeText(
      typeof label === 'string' ? label : label?.name,
    ).trim())
    .filter(Boolean);
}

function isRequiredSkillMention(text, skill) {
  const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const requirement = '(?:required|requires|required knowledge of|must have|must know|need|needs|essential|prerequisite)';
  const skillBeforeRequirement = new RegExp(
    `(^|[^a-z0-9+#])${escapedSkill}(?=$|[^a-z0-9+#])[^.!?\\n]{0,80}\\b${requirement}\\b`,
    'i',
  );
  const requirementBeforeSkill = new RegExp(
    `\\b${requirement}\\b[^.!?\\n]{0,80}(^|[^a-z0-9+#])${escapedSkill}(?=$|[^a-z0-9+#])`,
    'i',
  );

  return skillBeforeRequirement.test(text) || requirementBeforeSkill.test(text);
}

function getRequiredSkills(issue) {
  const text = getIssueText(issue);
  return REQUIRED_SKILL_CANDIDATES
    .filter((skill) => isRequiredSkillMention(text, skill));
}

function userHasSkill(userSkills, skill) {
  return userSkills.some((userSkill) =>
    containsTerm(normalizeText(userSkill), normalizeText(skill)));
}

function calculateSkillCompatibility(issue, userSkills) {
  const skills = userSkills.reduce((uniqueSkills, skill) => {
    const display = String(skill).trim();
    const normalized = normalizeText(display);

    if (normalized && !uniqueSkills.some((entry) => entry.normalized === normalized)) {
      uniqueSkills.push({ display, normalized });
    }

    return uniqueSkills;
  }, []);

  if (skills.length === 0) {
    return { score: 0, matchedSkills: [], missingEssentialSkills: [] };
  }

  const text = getIssueText(issue);
  const matchedSkills = skills
    .filter((skill) => containsTerm(text, skill.normalized))
    .map((skill) => skill.display);
  const requiredSkills = getRequiredSkills(issue);
  const missingEssentialSkills = requiredSkills.filter((skill) =>
    !userHasSkill(skills.map((entry) => entry.display), skill));
  const coverage = (matchedSkills.length / skills.length) * 100;
  const missingSkillPenalty = Math.min(missingEssentialSkills.length * 15, 45);

  return {
    score: clampScore(coverage - missingSkillPenalty),
    matchedSkills,
    missingEssentialSkills,
  };
}

function estimateDifficulty(issue) {
  const labels = getLabels(issue);
  const text = getIssueText(issue);

  if (labels.some((label) => ADVANCED_LABELS.has(label))
    || /\b(advanced|highly complex|architectural overhaul|distributed systems|performance critical)\b/i.test(text)) {
    return {
      level: 'Advanced',
      explanation: 'Marked advanced or contains strong complexity signals such as architectural, distributed-systems, or performance-critical work.',
    };
  }

  if (labels.some((label) => INTERMEDIATE_LABELS.has(label))
    || /\b(refactor|migration|multiple modules|breaking change|integration work)\b/i.test(text)) {
    return {
      level: 'Intermediate',
      explanation: 'Marked intermediate or describes cross-cutting work such as refactoring, migration, or integration.',
    };
  }

  if (labels.some((label) => BEGINNER_LABELS.has(label))
    || /\b(beginner friendly|good first issue|first timers only|easy fix|simple fix)\b/i.test(text)) {
    return {
      level: 'Beginner',
      explanation: 'A beginner-friendly label or an explicit easy/first-issue signal is present.',
    };
  }

  return {
    level: 'Intermediate',
    explanation: 'No explicit difficulty label or strong complexity signal was found; intermediate is the neutral estimate.',
  };
}

function calculateDifficultyCompatibility(difficulty, experience) {
  const experienceLevel = normalizeText(experience).trim();
  const compatibility = {
    beginner: { Beginner: 100, Intermediate: 65, Advanced: 30 },
    intermediate: { Beginner: 70, Intermediate: 100, Advanced: 65 },
    advanced: { Beginner: 45, Intermediate: 75, Advanced: 100 },
  };

  return compatibility[experienceLevel]?.[difficulty] ?? 50;
}

function calculateFreshness(updatedAt, now = Date.now()) {
  const updatedTime = Date.parse(updatedAt);

  if (Number.isNaN(updatedTime) || !Number.isFinite(now)) {
    return 0;
  }

  const ageInDays = Math.max(0, (now - updatedTime) / 86400000);

  if (ageInDays <= 7) return 100;
  if (ageInDays <= 30) return 85;
  if (ageInDays <= 90) return 65;
  if (ageInDays <= 180) return 40;
  if (ageInDays <= 365) return 20;
  return 5;
}

function calculateBeginnerFriendliness(issue) {
  const labels = getLabels(issue);
  const hasGoodFirstIssue = labels.some((label) =>
    label === 'good first issue' || label === 'good-first-issue');
  const hasBeginnerLabel = labels.some((label) =>
    BEGINNER_LABELS.has(label));
  const hasHelpWanted = labels.some((label) =>
    label === 'help wanted' || label === 'help-wanted');

  if (hasGoodFirstIssue) return 100;
  if (hasBeginnerLabel && hasHelpWanted) return 100;
  if (hasBeginnerLabel) return 90;
  if (hasHelpWanted) return 75;
  return 35;
}

function clampScore(score) {
  return Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;
}

function calculateComponentScores(issue, preferences, { now = Date.now() } = {}) {
  const skillCompatibility = calculateSkillCompatibility(
    issue,
    preferences.skills || [],
  );
  const estimatedDifficulty = estimateDifficulty(issue);

  return {
    skillCompatibility: skillCompatibility.score,
    difficultyCompatibility: calculateDifficultyCompatibility(
      estimatedDifficulty.level,
      preferences.experience,
    ),
    freshness: calculateFreshness(issue.updatedAt, now),
    beginnerFriendliness: calculateBeginnerFriendliness(issue),
    matchedSkills: skillCompatibility.matchedSkills,
    missingEssentialSkills: skillCompatibility.missingEssentialSkills,
    estimatedDifficulty,
  };
}

function calculateMatchScore(componentScores) {
  const weightedScore = Object.entries(WEIGHTS).reduce(
    (total, [component, weight]) =>
      total + componentScores[component] * weight,
    0,
  );

  return clampScore(weightedScore);
}

module.exports = {
  WEIGHTS,
  calculateBeginnerFriendliness,
  calculateComponentScores,
  calculateDifficultyCompatibility,
  calculateFreshness,
  calculateMatchScore,
  calculateSkillCompatibility,
  estimateDifficulty,
};
