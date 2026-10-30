import { useState } from 'react'
import { Dashboard as LiveDashboard, IssueDetail as LiveIssueDetail } from './ConnectedScreens.jsx'
import './App.css'

const skills = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'HTML', 'CSS', 'React', 'Node.js', 'SQL']
const levels = ['Beginner', 'Intermediate', 'Advanced']
const categories = ['Any category', 'Frontend', 'Backend & APIs', 'Documentation', 'Developer tools', 'Data & SQL']

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z" />,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20" /><path d="M8 7h7" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    github: <><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.1-1.5 6.1-6.8a5.3 5.3 0 0 0-1.4-3.7 4.9 4.9 0 0 0-.1-3.7S17.5.9 14 3.2a13.3 13.3 0 0 0-7 0C3.5.9 2.3 1.2 2.3 1.2a4.9 4.9 0 0 0-.1 3.7A5.3 5.3 0 0 0 .8 8.6c0 5.3 3.1 6.5 6.1 6.8a3.4 3.4 0 0 0-.9 2.7V22" /></>,
    code: <><path d="m8 8-4 4 4 4" /><path d="m16 8 4 4-4 4" /><path d="m14 5-4 14" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    list: <><path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
    filter: <><path d="M4 7h16" /><path d="M7 12h10" /><path d="M10 17h4" /></>,
    circleCheck: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.3 2.3 4.8-4.8" /></>,
  }

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Brand({ onClick }) {
  return <button className="brand" type="button" onClick={onClick} aria-label="OpenSource Buddy home"><span className="brand-mark"><Icon name="code" size={18} /></span><span>OpenSource <span className="brand-strong">Buddy</span></span></button>
}

function Header({ page, savedCount, onNavigate, onSection }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const navigate = (nextPage) => {
    closeMenu()
    onNavigate(nextPage)
  }
  const section = (id) => {
    closeMenu()
    onSection(id)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand onClick={() => navigate('home')} />
        <nav className={`main-nav ${menuOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
          <button className="nav-link" type="button" onClick={() => section('how-it-works')}>How It Works</button>
          <button className={page === 'dashboard' || page === 'detail' ? 'nav-link active' : 'nav-link'} type="button" onClick={() => navigate('dashboard')}>Discover Issues</button>
          <button className="nav-link" type="button" onClick={() => section('features')}>Features</button>
          <button className={`nav-link mobile-saved ${page === 'saved' ? 'active' : ''}`} type="button" onClick={() => navigate('saved')}>Saved Issues <span>{savedCount}</span></button>
          <button className="nav-link mobile-start" type="button" onClick={() => navigate('skills')}>Get Started <Icon name="arrow" size={15} /></button>
        </nav>
        <div className="header-actions">
          <button className={`header-saved ${page === 'saved' ? 'active' : ''}`} type="button" onClick={() => navigate('saved')} aria-label={`Saved issues, ${savedCount} saved`}><Icon name="bookmark" size={16} /><span>Saved Issues</span><span className="saved-count">{savedCount}</span></button>
          <button className="header-cta" type="button" onClick={() => navigate('skills')}>Get Started <Icon name="arrow" size={16} /></button>
          <button className="menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}><Icon name={menuOpen ? 'close' : 'menu'} size={19} /></button>
        </div>
      </div>
    </header>
  )
}

function Landing({ onStart, onSection }) {
  const features = [
    { icon: 'compass', title: 'Skill-Based Matching', copy: 'Find issues relevant to the languages and technologies you know.' },
    { icon: 'book', title: 'Beginner-Friendly Explanations', copy: 'Understand technical issue descriptions in plain language.' },
    { icon: 'circleCheck', title: 'Issue Readiness', copy: 'Review real GitHub issue status and update recency before choosing where to contribute.' },
    { icon: 'list', title: 'Contribution Roadmap', copy: 'Get actionable next steps for approaching an issue.' },
    { icon: 'layers', title: 'Match Transparency', copy: 'See which selected skills overlap and what you could learn.' },
    { icon: 'bookmark', title: 'Save for Later', copy: 'Bookmark promising examples and return to them anytime.' },
  ]

  return (
    <>
      <main>
        <section className="hero-section page-width">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR FIRST OPEN-SOURCE CONTRIBUTION STARTS HERE</div>
            <h1>Find your first issue.<br />Make your <span>first impact.</span></h1>
            <p className="hero-subtitle">Discover open-source issues that match your skills, understand what needs to be done, and take your first step into the open-source community.</p>
            <div className="hero-actions"><button className="button button-primary" type="button" onClick={onStart}>Find My First Issue <Icon name="arrow" /></button><button className="button button-quiet" type="button" onClick={() => onSection('how-it-works')}>See How It Works <span className="play-mark">↓</span></button></div>
            <div className="hero-proof"><span className="trust-check"><Icon name="check" size={14} /></span><span>Built for beginners. Powered by open source.</span></div>
          </div>
          <div className="hero-art" aria-label="Illustrative preview of an issue recommendation">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-note note-top"><span className="note-icon"><Icon name="sparkle" size={16} /></span><span><strong>Good first issue</strong><small>Sample readiness signals</small></span></div>
            <div className="preview-window">
              <div className="preview-top"><span className="window-dots"><i /><i /><i /></span><span>ILLUSTRATIVE PREVIEW</span><span className="live-dot" /></div>
              <div className="preview-profile"><div className="profile-icon"><Icon name="code" size={16} /></div><div><strong>sample-labs / leaf-ui</strong><small>Sample repository · Frontend</small></div></div>
              <div className="preview-issue"><div className="preview-issue-top"><span className="repo-mark">#</span><span>Issue #42 · Sample</span><span className="preview-match">92% match</span></div><strong>Add keyboard focus styles to the dropdown menu</strong><div className="preview-tags"><span>Beginner-friendly</span><span>CSS</span><span>JavaScript</span></div><div className="preview-readiness"><span><i /> Sample status: open · unassigned</span><span>Updated 2 days ago*</span></div></div>
              <div className="preview-bottom"><span><Icon name="circleCheck" size={14} /> Live results in discovery</span><span>PREVIEW</span></div>
            </div>
            <div className="art-note note-bottom"><span className="note-number">01</span><span><strong>Matched to your skills</strong><small>Scores come from the backend</small></span></div>
            <div className="art-scribble">✳</div>
          </div>
        </section>

        <section className="trust-strip"><div className="page-width trust-inner"><span>YOUR SKILLS CAN MAKE A DIFFERENCE</span><div className="tech-list"><span>Python</span><b>·</b><span>JavaScript</span><b>·</b><span>React</span><b>·</b><span>HTML &amp; CSS</span></div><span className="trust-note">One issue at a time.</span></div></section>

        <section className="how-section page-width" id="how-it-works">
          <div className="section-heading"><div><div className="eyebrow">A CLEARER WAY IN</div><h2>From curious beginner to open-source contributor.</h2></div><p>No guesswork, no pressure. Just a practical path to your first pull request.</p></div>
          <div className="steps-grid">
            <article className="step-card"><span className="step-number">01</span><div className="step-icon icon-green"><Icon name="code" size={21} /></div><h3>Tell us what you know.</h3><p>Select your programming languages, frameworks and experience level.</p><span className="step-foot">YOUR SKILLS, YOUR PACE</span></article>
            <article className="step-card"><span className="step-number">02</span><div className="step-icon icon-peach"><Icon name="compass" size={21} /></div><h3>Find issues that fit.</h3><p>Discover relevant issues ranked by skill compatibility and readiness.</p><span className="step-foot">LESS SCROLLING, MORE SIGNAL</span></article>
            <article className="step-card"><span className="step-number">03</span><div className="step-icon icon-blue"><Icon name="list" size={21} /></div><h3>Make your first contribution.</h3><p>Understand the problem, follow a guided roadmap and start contributing.</p><span className="step-foot">ONE STEP AT A TIME</span></article>
          </div>
        </section>

        <section className="features-section page-width" id="features">
          <div className="features-heading"><div><div className="eyebrow">BUILT AROUND YOUR FIRST CONTRIBUTION</div><h2>A little more clarity at every step.</h2></div><p>Every recommendation should help you make a confident next move.</p></div>
          <div className="feature-grid">{features.map((feature, index) => <article className="feature-card" key={feature.title}><span className={`feature-icon feature-tone-${index % 3}`}><Icon name={feature.icon} size={19} /></span><span className="feature-index">0{index + 1}</span><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}</div>
          <p className="feature-data-note">Issue recommendations and matching scores are loaded from the connected backend.</p>
        </section>

        <section className="feature-band"><div className="page-width feature-inner"><div><div className="eyebrow">YOUR CONTRIBUTION COMPANION</div><h2>Open source has room for you.</h2><p>A good first issue is more than a label. It’s a project you care about, a task you can understand, and a next step you can actually take.</p><button className="button button-light" type="button" onClick={onStart}>Find My First Issue <Icon name="arrow" /></button></div><div className="feature-list"><div><span className="feature-check"><Icon name="check" size={16} /></span><span><strong>Recommendations that make sense</strong><small>See skill overlaps and real issue status at a glance.</small></span></div><div><span className="feature-check"><Icon name="check" size={16} /></span><span><strong>Explanations without the jargon</strong><small>Understand each GitHub issue before you dive in.</small></span></div><div><span className="feature-check"><Icon name="check" size={16} /></span><span><strong>A roadmap for your first contribution</strong><small>Turn a big repo into small, doable steps.</small></span></div></div></div></section>
      </main>
      <Footer onHome={() => onSection('top')} />
    </>
  )
}

function Footer({ onHome }) {
  return <footer className="site-footer"><div className="page-width footer-inner"><Brand onClick={onHome} /><span>Built for beginners. Powered by open source.</span><span>© 2026 OpenSource Buddy</span></div></footer>
}

function skillMonogram(skill) {
  return ({ Python: 'Py', JavaScript: 'JS', TypeScript: 'TS', Java: 'J', 'C++': 'C+', HTML: '5', CSS: '3', React: 'R', 'Node.js': 'N', SQL: 'SQL' })[skill]
}

function Skills({ selectedSkills, setSelectedSkills, level, setLevel, category, setCategory, onContinue, onBack }) {
  const [validationMessage, setValidationMessage] = useState('')
  const toggleSkill = (skill) => {
    setValidationMessage('')
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((item) => item !== skill))
    } else if (selectedSkills.length >= 6) {
      setValidationMessage('Choose up to 6 skills for issue discovery.')
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }
  const continueToMatches = () => {
    if (!selectedSkills.length) {
      setValidationMessage('Select at least one skill to see your matches.')
      return
    }
    onContinue()
  }

  return (
    <main className="flow-page page-width">
      <button className="back-link" type="button" onClick={onBack}>← Back to home</button>
      <div className="flow-heading"><div className="eyebrow">A FEW QUICK PICKS</div><h1>Let’s find issues that fit you.</h1><p>Choose what you know, then tell us what kind of projects interest you.</p></div>
      <div className="skills-layout">
        <section className="selection-panel">
          <div className="panel-heading"><div><span className="panel-step">01 / YOUR SKILLS</span><h2>What can you work with?</h2></div><span className="optional-label">SELECT UP TO 6</span></div>
          <div className="language-grid" role="group" aria-label="Select programming skills">{skills.map((skill) => <button key={skill} className={`language-option ${selectedSkills.includes(skill) ? 'selected' : ''}`} type="button" aria-pressed={selectedSkills.includes(skill)} onClick={() => toggleSkill(skill)}><span className={`language-monogram monogram-${skill.toLowerCase().replace(/[^a-z]/g, '')}`}>{skillMonogram(skill)}</span><span>{skill}</span>{selectedSkills.includes(skill) && <span className="selected-check"><Icon name="check" size={14} /></span>}</button>)}</div>
          <div className="selection-divider" />
          <div className="panel-heading level-heading"><div><span className="panel-step">02 / EXPERIENCE</span><h2>What feels like your level?</h2></div></div>
          <div className="level-options" role="group" aria-label="Select experience level">{levels.map((item, index) => <button key={item} className={`level-option ${level === item ? 'selected' : ''}`} type="button" aria-pressed={level === item} onClick={() => setLevel(item)}><span className="level-radio" /><span className="level-copy"><strong>{item}</strong><small>{['I’m new to contributing or still learning the basics.', 'I’m comfortable building things and learning as I go.', 'I’m ready to take on more complex issues.'][index]}</small></span></button>)}</div>
          <div className="selection-divider category-divider" />
          <div className="panel-heading level-heading"><div><span className="panel-step">03 / PROJECT INTEREST</span><h2>What would you like to explore?</h2></div><span className="optional-label">OPTIONAL</span></div>
          <label className="category-select-wrap"><span className="sr-only">Preferred project category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><span aria-hidden="true">⌄</span></label>
          <div className="form-footer"><span aria-live="polite">{validationMessage || (selectedSkills.length ? `${selectedSkills.length} ${selectedSkills.length === 1 ? 'skill' : 'skills'} selected` : 'Choose at least one skill to continue')}</span><button className="button button-primary" type="button" onClick={continueToMatches}>Continue <Icon name="arrow" /></button></div>
        </section>
        <aside className="skills-aside"><span className="aside-star"><Icon name="sparkle" size={22} /></span><span className="aside-label">A NOTE FOR FIRST-TIMERS</span><h3>You don’t need to know everything.</h3><p>Pick the languages you’re learning or curious about. The right issue should help you grow, not ask you to be an expert already.</p><div className="aside-rule" /><span className="aside-foot"><Icon name="check" size={15} /> You can change these any time</span></aside>
      </div>
    </main>
  )
}

function readSavedState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem('opensource-buddy-saved-issues') || '[]')
    const savedIssues = JSON.parse(window.localStorage.getItem('opensource-buddy-saved-issue-data') || '{}')
    const issues = savedIssues && typeof savedIssues === 'object' && !Array.isArray(savedIssues)
      ? savedIssues
      : {}
    return {
      ids: Array.isArray(saved)
        ? saved.filter((id) => Number.isInteger(id) && Object.hasOwn(issues, id))
        : [],
      issues,
      error: '',
    }
  } catch {
    return { ids: [], issues: {}, error: 'Browser storage could not be read, so saved issues may not persist.' }
  }
}

function App() {
  const [page, setPage] = useState('home')
  const [selectedSkills, setSelectedSkills] = useState(['JavaScript', 'CSS'])
  const [level, setLevel] = useState('Beginner')
  const [category, setCategory] = useState('Any category')
  const [initialSaved] = useState(readSavedState)
  const [saved, setSaved] = useState(initialSaved.ids)
  const [savedIssues, setSavedIssues] = useState(initialSaved.issues)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [detailOrigin, setDetailOrigin] = useState('dashboard')
  const [storageError, setStorageError] = useState(initialSaved.error)

  const toggleSavedIssue = (issue) => {
    const isSaved = saved.includes(issue.id)
    const nextSaved = isSaved
      ? saved.filter((id) => id !== issue.id)
      : [...saved, issue.id]
    const nextIssues = { ...savedIssues }
    if (isSaved) delete nextIssues[issue.id]
    else nextIssues[issue.id] = issue

    setSaved(nextSaved)
    setSavedIssues(nextIssues)
    try {
      window.localStorage.setItem('opensource-buddy-saved-issues', JSON.stringify(nextSaved))
      window.localStorage.setItem('opensource-buddy-saved-issue-data', JSON.stringify(nextIssues))
      setStorageError('')
    } catch {
      setStorageError('Browser storage is unavailable, so saved issues may not persist after you leave.')
    }
  }

  const navigate = (nextPage) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const navigateToSection = (id) => {
    if (id === 'top') {
      navigate('home')
      return
    }
    if (page !== 'home') setPage('home')
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), page === 'home' ? 0 : 80)
  }
  const openIssue = (issue) => {
    setSelectedIssue(issue)
    setDetailOrigin(page === 'saved' ? 'saved' : 'dashboard')
    navigate('detail')
  }

  return <div className="app-shell"><Header page={page} savedCount={saved.length} onNavigate={navigate} onSection={navigateToSection} />
    {page === 'home' && <Landing onStart={() => navigate('skills')} onSection={navigateToSection} />}
    {page === 'skills' && <Skills selectedSkills={selectedSkills} setSelectedSkills={setSelectedSkills} level={level} setLevel={setLevel} category={category} setCategory={setCategory} onContinue={() => navigate('dashboard')} onBack={() => navigate('home')} />}
    {(page === 'dashboard' || page === 'saved') && <LiveDashboard key={page} selectedSkills={selectedSkills} level={level} category={category} saved={saved} savedIssues={savedIssues} onToggleSave={toggleSavedIssue} onSelectIssue={openIssue} onEditPreferences={() => navigate('skills')} onOpenSaved={() => navigate('saved')} onDiscover={() => navigate('dashboard')} view={page} storageError={storageError} />}
    {page === 'detail' && selectedIssue && <LiveIssueDetail key={selectedIssue.id} issue={selectedIssue} selectedSkills={selectedSkills} experience={level} onBack={() => navigate(detailOrigin)} isSaved={saved.includes(selectedIssue.id)} onBookmark={() => toggleSavedIssue(selectedIssue)} />}
    {page !== 'home' && <Footer onHome={() => navigate('home')} />}
  </div>
}

export default App