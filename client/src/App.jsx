import { useState, useEffect, useRef } from 'react';
import {
  Link2,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Tag,
  Zap,
  Code2,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import './App.css';

const DEV_LINK = "#"; // TODO: replace with the real URL

/* ==========================================================================
   FEATURE DATA
   ========================================================================== */
const FEATURES = [
  {
    icon: Tag,
    title: 'Custom Aliases',
    description: 'Choose your own short codes for memorable, branded links.',
  },
  {
    icon: Zap,
    title: 'Redis-Cached Redirects',
    description: 'Cache-aside lookups for sub-millisecond redirect latency.',
  },
  {
    icon: Code2,
    title: 'Simple REST API',
    description: 'One POST to shorten, one GET to redirect. Nothing more.',
  },
  {
    icon: Shield,
    title: 'Rate Limited',
    description: 'Built-in per-IP rate limiting to keep the service fair.',
  },
];

/* ==========================================================================
   FEATURE CARD (scroll-animated)
   ========================================================================== */
function FeatureCard({ icon: Icon, title, description, index }) {
  const prefersReduced = useReducedMotion();

  const variants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
      };

  return (
    <motion.div
      className="feature-card"
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.1 }}
    >
      <div className="feature-icon-wrapper">
        <Icon size={22} className="feature-icon" />
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </motion.div>
  );
}

/* ==========================================================================
   APP
   ========================================================================== */
function App() {
  const [longUrl, setLongUrl] = useState('');
  const [useCustomAlias, setUseCustomAlias] = useState(false);
  const [customAlias, setCustomAlias] = useState('');
  const [expiresIn, setExpiresIn] = useState(86400);
  
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Header scroll state
  const [scrolled, setScrolled] = useState(false);
  // Mobile nav
  const [menuOpen, setMenuOpen] = useState(false);
  // Active section tracking
  const [activeSection, setActiveSection] = useState('');

  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  const prefersReduced = useReducedMotion();

  /* ---------- scroll listener for header & active section ---------- */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);

      // Determine active section
      const sections = [
        { id: 'features', ref: featuresRef },
      ];
      let current = '';
      for (const s of sections) {
        if (s.ref.current) {
          const rect = s.ref.current.getBoundingClientRect();
          if (rect.top <= 200) current = s.id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ---------- close mobile menu on anchor click ---------- */
  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  /* ---------- POST /urls (with customCode and expiresIn) ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl.trim() || isLoading) return;

    setError('');
    setShortUrl('');
    setIsLoading(true);

    try {
      const payload = {
        longUrl,
        expiresIn: Number(expiresIn),
      };
      if (useCustomAlias && customAlias.trim()) {
        payload.customCode = customAlias.trim();
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setShortUrl(data.shortUrl);
      setLongUrl(''); // Clear input for the next URL
      setCustomAlias(''); // Clear alias for the next URL
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="layout-wrapper">
      {/* Decorative Glow */}
      <div className="bg-glow" aria-hidden="true" />

      {/* ================================================================
          HEADER
          ================================================================ */}
      <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
        <div className="header-container">
          <div className="logo">
            <Link2 className="logo-icon" size={20} />
            <span className="logo-text">Knot</span>
          </div>

          {/* Desktop nav */}
          <nav className="nav-desktop">
            <a
              href="#features"
              className={`nav-link${activeSection === 'features' ? ' nav-link--active' : ''}`}
              onClick={(e) => handleNavClick(e, 'features')}
            >
              Features
            </a>
            <a
              href={DEV_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              Dev
            </a>
            <div className="status-indicator">
              <span className="status-dot" />
              <span className="status-text">API Online</span>
            </div>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile slide-down menu */}
        {menuOpen && (
          <nav className="nav-mobile">
            <a
              href="#features"
              className="nav-link"
              onClick={(e) => handleNavClick(e, 'features')}
            >
              Features
            </a>
            <a
              href={DEV_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              Dev
            </a>
            <div className="status-indicator status-indicator--mobile">
              <span className="status-dot" />
              <span className="status-text">API Online</span>
            </div>
          </nav>
        )}
      </header>

      {/* ================================================================
          HERO
          ================================================================ */}
      <main className="main-content" ref={heroRef}>
        <section className="hero">
          <div className="eyebrow hero-stagger-1">FAST • SIMPLE • SHAREABLE</div>
          <h1 className="hero-title hero-stagger-2">Short links. Zero clutter.</h1>
          <p className="hero-subtitle hero-stagger-3">
            Turn long URLs into clean, shareable links in seconds.
          </p>
        </section>

        {/* ================================================================
            MAIN CARD
            ================================================================ */}
        <div className="card-container card-entrance">
          <form onSubmit={handleSubmit} className="shortener-form">
            <div className="form-inner">
              <div className="input-wrapper">
                <Link2 className="input-icon" size={20} />
                <input
                  type="url"
                  className="url-input"
                  placeholder="Paste your long URL here..."
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  required
                  disabled={isLoading}
                  aria-label="Long URL to shorten"
                />
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isLoading || !longUrl.trim()}
                  aria-label={isLoading ? 'Shortening' : 'Shorten URL'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="btn-icon spinner" size={18} />
                      <span>Shortening...</span>
                    </>
                  ) : (
                    <>
                      <span>Shorten URL</span>
                      <ArrowRight className="btn-icon" size={18} />
                    </>
                  )}
                </button>
              </div>

              <div className="options-row">
                <div className="toggle-row">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={useCustomAlias}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setUseCustomAlias(isChecked);
                        if (!isChecked) {
                          setCustomAlias('');
                        }
                      }}
                      disabled={isLoading}
                    />
                    <div className="toggle-switch"></div>
                    <span className="toggle-text">Use a custom alias</span>
                  </label>
                </div>

                <div className="expiry-wrapper">
                  <label htmlFor="expiry-select" className="expiry-label">
                    Expires in
                  </label>
                  <select
                    id="expiry-select"
                    className="expiry-select"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                    disabled={isLoading}
                    aria-label="Expires in"
                  >
                    <option value={3600}>1 hour</option>
                    <option value={21600}>6 hours</option>
                    <option value={43200}>12 hours</option>
                    <option value={86400}>24 hours</option>
                    <option value={259200}>3 days</option>
                  </select>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {useCustomAlias && (
                  <motion.div
                    initial={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={prefersReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                    exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="custom-alias-wrapper">
                      <span className="alias-prefix">/</span>
                      <input
                        type="text"
                        className="alias-input"
                        placeholder="e.g. ques1"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        disabled={isLoading}
                        aria-label="Custom alias"
                        pattern="^[a-zA-Z0-9_-]+$"
                        title="Only letters, numbers, hyphens, and underscores are allowed"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* ERROR STATE */}
          {error && (
            <div className="error-panel fade-up" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* SUCCESS RESULT */}
          {shortUrl && (
            <div className="result-panel fade-up">
              <div className="result-header">
                <CheckCircle2 size={16} className="success-icon" />
                <span className="result-label">Your short link is ready</span>
              </div>
              <div className="result-box">
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="short-url-link"
                >
                  {shortUrl}
                </a>
                <button
                  onClick={copyToClipboard}
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  title="Copy to clipboard"
                  aria-label="Copy short URL"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span className="sr-only">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span className="sr-only">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================
            FEATURES
            ================================================================ */}
        <section id="features" className="section features-section" ref={featuresRef}>
          <h2 className="section-heading">What&rsquo;s under the hood</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} index={i} {...f} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
