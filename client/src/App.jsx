import { useState } from 'react';
import { 
  Link2, 
  Copy, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import './App.css';

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl.trim() || isLoading) return;

    setError('');
    setShortUrl('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setShortUrl(data.shortUrl);
      setLongUrl(''); // Clear input for the next URL
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

      {/* HEADER */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <Link2 className="logo-icon" size={20} />
            <span className="logo-text">URL Shortener</span>
          </div>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">API Online</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-content">
        
        {/* HERO */}
        <section className="hero">
          <div className="eyebrow">FAST • SIMPLE • SHAREABLE</div>
          <h1 className="hero-title">Short links. Zero clutter.</h1>
          <p className="hero-subtitle">
            Turn long URLs into clean, shareable links in seconds.
          </p>
        </section>

        {/* MAIN CARD */}
        <div className="card-container fade-up">
          <form onSubmit={handleSubmit} className="shortener-form">
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
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <p>Built for speed and simplicity.</p>
      </footer>
    </div>
  );
}

export default App;
