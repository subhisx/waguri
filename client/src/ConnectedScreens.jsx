import { useEffect, useMemo, useState } from 'react'
import { checkBackend, createRoadmap, discoverIssues, explainIssue } from './api.js'

const levels = ['Beginner', 'Intermediate', 'Advanced']

function Icon({ name, size = 16 }) {
  const paths = {
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  }

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function updatedDays(issue) {
  const timestamp = Date.parse(issue.updatedAt)
  return Number.isNaN(timestamp)
    ? null
    : Math.max(0, Math.floor((Date.now() - timestamp) / 86400000))
}

function issueStatus(issue) {
  return issue.assignees.length
    ? 'Assigned · availability uncertain'
    : 'Unassigned · availability not guaranteed'
}

function IssueCard({ issue, isSaved, onSave, onOpen }) {
  const days = updatedDays(issue)
  const skills = issue.matchedSkills || []

  return <article className="issue-card">
    <div className="issue-card-top"><div className="repo-name"><span className="repo-symbol">◈</span>{issue.repository}</div><button className={`save-button ${isSaved ? 'saved' : ''}`} type="button" aria-label={isSaved ? 'Remove bookmark' : 'Bookmark issue'} title={isSaved ? 'Remove bookmark' : 'Bookmark issue'} onClick={onSave}><Icon name="bookmark" size={18} /></button></div>
    <button className="issue-title-button" type="button" onClick={onOpen}><h3>{issue.title}</h3></button>
    <div className="issue-tags"><span className={`difficulty-tag ${issue.estimatedDifficulty.toLowerCase()}`}>{issue.estimatedDifficulty}</span>{issue.labels.map((label) => <span className="skill-tag issue-label" key={label}>{label}</span>)}{skills.map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}</div>
    <p className="issue-description">{issue.description || 'No description was provided on GitHub.'}</p>
    <div className="issue-status-row"><span className="availability"><i /> {issueStatus(issue)}</span><span><Icon name="clock" size={12} /> Updated {days === null ? 'date unavailable' : `${days} days ago`}</span></div>
    <div className="issue-card-bottom"><div className="match-score"><span className="match-ring">{issue.matchScore}</span><span><strong>{issue.matchScore}% match</strong><small>Deterministic match score</small></span></div><button className="view-issue" type="button" onClick={onOpen}>View issue <Icon name="arrow" size={16} /></button></div>
  </article>
}

export function Dashboard({
  selectedSkills,
  level,
  category,
  saved,
  savedIssues,
  onToggleSave,
  onSelectIssue,
  onEditPreferences,
  onOpenSaved,
  onDiscover,
  view,
  storageError,
}) {
  const isSavedView = view === 'saved'
  const [query, setQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState('All matched skills')
  const [difficultyFilter, setDifficultyFilter] = useState('All levels')
  const [freshnessFilter, setFreshnessFilter] = useState('Any time')
  const [sortBy, setSortBy] = useState('Best match')
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(!isSavedView)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (isSavedView) return undefined

    const controller = new AbortController()

    checkBackend({ signal: controller.signal })
      .then(() => discoverIssues({
        skills: selectedSkills,
        experience: level,
        category,
      }, { signal: controller.signal }))
      .then((result) => {
        if (!Array.isArray(result.issues)) {
          throw new Error('Backend response did not include an issues array.')
        }
        setIssues(result.issues)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [isSavedView, selectedSkills, level, category, retryCount])

  const visibleIssues = isSavedView
    ? Object.values(savedIssues).filter((issue) => saved.includes(issue.id))
    : issues

  const retrySearch = () => {
    setLoading(true)
    setError('')
    setIssues([])
    setRetryCount((count) => count + 1)
  }

  const filteredIssues = useMemo(() => {
    const matches = visibleIssues.filter((issue) => {
      const skills = issue.matchedSkills || []
      const text = `${issue.repository} ${issue.title} ${skills.join(' ')} ${issue.labels.join(' ')}`.toLowerCase()
      const matchesQuery = text.includes(query.toLowerCase())
      const matchesSkill = skillFilter === 'All matched skills' || skills.includes(skillFilter)
      const matchesDifficulty = difficultyFilter === 'All levels'
        || issue.estimatedDifficulty === difficultyFilter
      const age = updatedDays(issue)
      const matchesFreshness = freshnessFilter === 'Any time'
        || (age !== null && age <= Number(freshnessFilter))
      return matchesQuery && matchesSkill && matchesDifficulty && matchesFreshness
    })

    return matches.sort((first, second) => sortBy === 'Most recent'
      ? (Date.parse(second.updatedAt) || 0) - (Date.parse(first.updatedAt) || 0)
      : second.matchScore - first.matchScore)
  }, [visibleIssues, query, skillFilter, difficultyFilter, freshnessFilter, sortBy])

  return (
    <main className="dashboard page-width">
      <div className="dashboard-topline"><span className="demo-pill"><i /> LIVE GITHUB RESULTS</span>{isSavedView && <span className="saved-view-label"><Icon name="bookmark" size={14} /> YOUR SAVED LIST</span>}</div>
      <section className="dashboard-intro"><div><div className="eyebrow">{isSavedView ? 'YOUR READING LIST' : 'YOUR NEXT CONTRIBUTION'}</div><h1>{isSavedView ? 'Saved for your next session.' : 'Your next contribution starts here.'}</h1><p>{isSavedView ? 'The GitHub issues you bookmarked are gathered here.' : `Based on ${selectedSkills.join(', ')} and your ${level.toLowerCase()} experience level${category !== 'Any category' ? ` · ${category}` : ''}.`}</p></div><div className="profile-chip"><span className="profile-chip-icon"><Icon name="spark" size={17} /></span><span><strong>{selectedSkills.length} skills</strong><small>{level} level</small></span><button type="button" onClick={onEditPreferences} aria-label="Edit skills">Edit</button></div></section>
      {storageError && <div className="storage-warning" role="status">{storageError}</div>}
      <section className="results-section">
        <div className="results-title"><div><h2>{isSavedView ? 'Your saved issues' : 'Recommended for you'} <span>{loading ? '…' : filteredIssues.length}</span></h2><p>{isSavedView ? 'Saved GitHub issues stay in this browser.' : 'Ranked by your deterministic match scores.'}</p></div>{!isSavedView && <button className="bookmark-filter" type="button" onClick={onOpenSaved}><Icon name="bookmark" size={16} /> Saved <span>{saved.length}</span></button>}</div>
        <div className="filters-row"><label className="search-box"><Icon name="search" size={18} /><input type="search" placeholder="Search issues, repositories, skills..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search issues" /></label><label className="select-wrap"><span className="sr-only">Filter by skill</span><select value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)}><option>All matched skills</option>{selectedSkills.map((skill) => <option key={skill}>{skill}</option>)}</select><span className="select-arrow">⌄</span></label><label className="select-wrap"><span className="sr-only">Filter by difficulty</span><select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)}><option>All levels</option>{levels.map((item) => <option key={item}>{item}</option>)}</select><span className="select-arrow">⌄</span></label><label className="select-wrap"><span className="sr-only">Filter by freshness</span><select value={freshnessFilter} onChange={(event) => setFreshnessFilter(event.target.value)}><option>Any time</option><option value="7">Past week</option><option value="30">Past month</option></select><span className="select-arrow">⌄</span></label><label className="select-wrap sort-select"><span className="sr-only">Sort issues</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option>Best match</option><option>Most recent</option></select><span className="select-arrow">⌄</span></label></div>
        {loading && <div className="empty-state" role="status"><h3>Checking the backend and searching GitHub…</h3><p>Your recommendations will appear as soon as the search finishes.</p></div>}
        {!loading && error && <div className="empty-state" role="alert"><h3>Could not load GitHub issues</h3><p>{error}</p><button className="button button-secondary" type="button" onClick={retrySearch}>Try again</button></div>}
        {!loading && !error && filteredIssues.length > 0 && <div className="issue-grid">{filteredIssues.map((issue) => <IssueCard key={issue.id} issue={issue} isSaved={saved.includes(issue.id)} onSave={() => onToggleSave(issue)} onOpen={() => onSelectIssue(issue)} />)}</div>}
        {!loading && !error && filteredIssues.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name={isSavedView ? 'bookmark' : 'search'} size={22} /></span><h3>{isSavedView ? 'Nothing saved just yet' : issues.length ? 'No issues match these filters' : 'No GitHub issues found'}</h3><p>{isSavedView ? 'Bookmark a real GitHub issue and it will be waiting here.' : issues.length ? 'Try another search, skill, difficulty, freshness, or sort option.' : 'GitHub returned no issues for these preferences. Try changing your skills or project category.'}</p>{isSavedView ? <button className="button button-secondary" type="button" onClick={onDiscover}>Discover issues <Icon name="arrow" size={15} /></button> : issues.length > 0 && <button className="button button-secondary" type="button" onClick={() => { setQuery(''); setSkillFilter('All matched skills'); setDifficultyFilter('All levels'); setFreshnessFilter('Any time'); setSortBy('Best match') }}>Clear filters</button>}</div>}
      </section>
      <div className="dashboard-footnote"><Icon name="clock" size={15} /> Unassigned status does not guarantee availability. Issue update times come from GitHub.</div>
    </main>
  )
}

function AISection({ title, loading, error, onRetry, children }) {
  return <div className="detail-section">
    <div className="detail-section-heading"><span className="detail-icon"><Icon name="spark" size={18} /></span><div><span className="section-kicker">LOCAL GEMMA AI</span><h2>{title}</h2></div></div>
    {loading && <p className="detail-explanation" role="status">Asking the local AI model…</p>}
    {!loading && error && <div className="detail-explanation" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={() => onRetry()}>Try again</button></div>}
    {!loading && !error && children}
  </div>
}

export function IssueDetail({ issue, selectedSkills, experience, onBack, onBookmark, isSaved }) {
  const [explanation, setExplanation] = useState(null)
  const [explanationLoading, setExplanationLoading] = useState(true)
  const [explanationError, setExplanationError] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(true)
  const [roadmapError, setRoadmapError] = useState('')

  const loadExplanation = () => {
    setExplanation(null)
    setExplanationError('')
    setExplanationLoading(true)
    explainIssue({ skills: selectedSkills, experience, issue })
      .then((result) => setExplanation(result.explanation))
      .catch((error) => setExplanationError(error.message))
      .finally(() => setExplanationLoading(false))
  }

  const loadRoadmap = () => {
    setRoadmap(null)
    setRoadmapError('')
    setRoadmapLoading(true)
    createRoadmap({ skills: selectedSkills, experience, issue })
      .then((result) => setRoadmap(result.roadmap))
      .catch((error) => setRoadmapError(error.message))
      .finally(() => setRoadmapLoading(false))
  }

  useEffect(() => {
    const explanationController = new AbortController()
    const roadmapController = new AbortController()
    explainIssue(
      { skills: selectedSkills, experience, issue },
      { signal: explanationController.signal },
    )
      .then((result) => setExplanation(result.explanation))
      .catch((error) => {
        if (!explanationController.signal.aborted) setExplanationError(error.message)
      })
      .finally(() => {
        if (!explanationController.signal.aborted) setExplanationLoading(false)
      })
    createRoadmap(
      { skills: selectedSkills, experience, issue },
      { signal: roadmapController.signal },
    )
      .then((result) => setRoadmap(result.roadmap))
      .catch((error) => {
        if (!roadmapController.signal.aborted) setRoadmapError(error.message)
      })
      .finally(() => {
        if (!roadmapController.signal.aborted) setRoadmapLoading(false)
      })
    return () => {
      explanationController.abort()
      roadmapController.abort()
    }
  }, [issue, selectedSkills, experience])

  return <main className="detail-page page-width">
    <button className="back-link" type="button" onClick={onBack}>← Back to issue list</button>
    <div className="detail-layout">
      <article className="detail-main">
        <div className="detail-repo"><span className="repo-symbol">◈</span>{issue.repository}<a className="detail-demo" href={issue.url} target="_blank" rel="noreferrer">OPEN ON GITHUB</a></div>
        <h1>{issue.title}</h1>
        <div className="issue-tags detail-tags"><span className={`difficulty-tag ${issue.estimatedDifficulty.toLowerCase()}`}>{issue.estimatedDifficulty} · estimated</span>{issue.labels.map((label) => <span className="skill-tag issue-label" key={label}>{label}</span>)}</div>
        <div className="detail-section"><div className="detail-section-heading"><span className="detail-icon"><Icon name="external" size={18} /></span><div><span className="section-kicker">GITHUB ISSUE</span><h2>Issue description</h2></div></div><p className="detail-explanation">{issue.description || 'No description was provided on GitHub.'}</p></div>
        <AISection title="Understand this issue" loading={explanationLoading} error={explanationError} onRetry={() => { setExplanation(null); setExplanationError(''); setExplanationLoading(true); loadExplanation() }}>
          <p className="detail-explanation"><strong>Summary:</strong> {explanation?.summary}</p>
          <p className="detail-explanation"><strong>Problem to solve:</strong> {explanation?.problem}</p>
          <p className="detail-explanation"><strong>Why it matches:</strong> {explanation?.whyItMatches}</p>
          <p className="detail-explanation"><strong>Difficulty:</strong> {explanation?.estimatedDifficulty.level} — {explanation?.estimatedDifficulty.explanation}</p>
          <p className="detail-explanation"><strong>Required skills:</strong> {explanation?.requiredSkills.join(', ') || 'Not specified'}</p>
          <p className="detail-explanation"><strong>Prerequisites:</strong> {explanation?.prerequisites.join('; ') || 'Not specified'}</p>
          <p className="detail-explanation"><strong>Possible challenges:</strong> {explanation?.possibleChallenges.join('; ') || 'Not specified'}</p>
        </AISection>
        <AISection title="Contribution roadmap" loading={roadmapLoading} error={roadmapError} onRetry={() => { setRoadmap(null); setRoadmapError(''); setRoadmapLoading(true); loadRoadmap() }}>
          <ol className="roadmap">{roadmap?.steps.map((step) => <li key={step.number}><span className="roadmap-number">{String(step.number).padStart(2, '0')}</span><span><strong>{step.title}.</strong> {step.instructions}</span></li>)}</ol>
          <p className="detail-explanation"><strong>Testing advice:</strong> {roadmap?.testingAdvice}</p>
          <p className="detail-explanation"><strong>Pull request advice:</strong> {roadmap?.pullRequestAdvice}</p>
        </AISection>
        <div className="detail-section learning-section"><div className="detail-section-heading"><span className="detail-icon"><Icon name="bookmark" size={18} /></span><div><span className="section-kicker">LEARNING TOPICS &amp; TOOLS</span><h2>Useful concepts to explore</h2></div></div>{roadmapLoading && <p className="detail-explanation">Loading learning topics and tools…</p>}{roadmapError && <p className="detail-explanation" role="alert">{roadmapError}</p>}{roadmap && <><div className="learning-topics">{roadmap.learningTopics.map((topic) => <span key={topic}>{topic}</span>)}</div><div className="learning-topics">{roadmap.recommendedTools.map((tool) => <span key={tool}>{tool}</span>)}</div></>}</div>
      </article>
      <aside className="detail-sidebar">
        <div className="match-panel"><div className="match-panel-top"><span>DETERMINISTIC MATCH</span><Icon name="spark" size={17} /></div><div className="large-match">{issue.matchScore}<span>%</span></div><p>Based on your skills, experience, issue freshness, and beginner-friendly labels.</p><div className="sidebar-divider" /><div className="sidebar-label">COMPONENT SCORES</div><div className="required-skills">{Object.entries(issue.componentScores).map(([name, value]) => <span key={name}>{name.replace(/([A-Z])/g, ' $1')}: <strong>{value}</strong></span>)}</div><div className="sidebar-divider" /><div className="sidebar-label">SKILLS MATCHED</div><div className="required-skills">{(issue.matchedSkills || []).map((skill) => <span key={skill}>{skill}</span>)}{issue.missingEssentialSkills?.map((skill) => <span key={skill}>Missing essential: {skill}</span>)}</div><div className="sidebar-divider" /><span className="availability"><i /> {issue.assignees.length ? 'Assigned · availability uncertain' : 'Unassigned · not guaranteed available'}</span><button className={`button ${isSaved ? 'button-secondary' : 'button-primary'} full-button`} type="button" onClick={onBookmark}><Icon name="bookmark" size={17} /> {isSaved ? 'Saved to your list' : 'Save this issue'}</button><a className="button button-github full-button" href={issue.url} target="_blank" rel="noreferrer">Open GitHub issue <Icon name="external" size={15} /></a></div>
      </aside>
    </div>
  </main>
}
