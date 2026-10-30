function isEligibleIssue(issue) {
  if (!issue || issue.state && issue.state !== 'open') {
    return false;
  }

  if (issue.pull_request || issue.isPullRequest) {
    return false;
  }

  const metadata = issue.repositoryMetadata || issue.repository || {};
  return metadata.archived !== true && issue.archived !== true;
}

function filterIssues(issues) {
  if (!Array.isArray(issues)) {
    throw new TypeError('Issues must be provided as an array.');
  }

  return issues.filter(isEligibleIssue);
}

module.exports = {
  filterIssues,
  isEligibleIssue,
};
