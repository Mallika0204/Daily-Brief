import { useEffect, useMemo, useState } from 'react';

type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceUrl: string;
  category: string;
  section: string;
  publishedAt: string | null;
};

type FeedSource = {
  source: string;
  section: string;
  category: string;
  url: string;
  ok: boolean;
  count: number;
  error: string | null;
};

type NewsResponse = {
  articles: Article[];
  sources: FeedSource[];
  updatedAt: string;
};

const FILTERS = ['All', 'India', 'World', 'Business', 'Technology'];

function formatDate(value: string | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function App() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/news`);
      if (!response.ok) throw new Error('News could not be loaded. Please try again.');
      const result: NewsResponse = await response.json();
      setData(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'News could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const articles = useMemo(() => {
    if (!data) return [];
    return filter === 'All'
      ? data.articles
      : data.articles.filter((article) => article.category === filter);
  }, [data, filter]);

  const failedSources = data?.sources.filter((source) => !source.ok) ?? [];
  const workingSources = data?.sources.filter((source) => source.ok) ?? [];

  return (
    <main className="welcome">
      <header className="masthead">
        <div className="publication-mark" aria-hidden="true">DB</div>
        <div className="masthead-copy">
          <p className="eyebrow">THE DAILY BRIEF</p>
          <h1>A clearer view of the world.</h1>
          <p className="intro">The stories making a difference, from India and around the world.</p>
        </div>
        <button className="refresh-button" type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Updating…' : 'Refresh'}
        </button>
      </header>

      <p className="publisher-note">
        Headlines from <a href="https://www.bbc.com/news" target="_blank" rel="noreferrer">BBC News</a>
        {' '}and <a href="https://www.thehindu.com/" target="_blank" rel="noreferrer">The Hindu</a>.
        {' '}Read each original story at its source.
      </p>

      <nav className="filters" aria-label="Filter news by topic">
        {FILTERS.map((topic) => (
          <button
            className={`filter-button${filter === topic ? ' is-active' : ''}`}
            key={topic}
            type="button"
            aria-pressed={filter === topic}
            onClick={() => setFilter(topic)}
          >
            {topic}
          </button>
        ))}
      </nav>

      <section className="feed" aria-live="polite" aria-busy={loading}>
        <div className="feed-heading">
          <h2>{filter === 'All' ? 'Latest stories' : filter}</h2>
          <span>{loading ? 'Checking sources…' : `${articles.length} ${articles.length === 1 ? 'story' : 'stories'}`}</span>
        </div>

        {error && <div className="feed-message error-message" role="alert">{error}</div>}

        {failedSources.length > 0 && (
          <div className="feed-message source-warning" role="status">
            <strong>Some sources are unavailable.</strong>
            <ul>
              {failedSources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.source} · {source.section}
                  </a>{' '}could not be loaded. Other sources are still available.
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="feed-message">
            {workingSources.length === 0
              ? 'News feeds are temporarily unavailable. Please try again later.'
              : `No ${filter === 'All' ? '' : `${filter.toLowerCase()} `}stories are available right now.`}
          </div>
        )}

        <div className="story-list">
          {articles.map((article) => (
            <article className="story" key={article.id}>
              <div className="story-meta">
                <a className="story-source" href={article.sourceUrl} target="_blank" rel="noreferrer">
                  {article.source}
                </a>
                <span className="meta-separator">·</span>
                <span>{formatDate(article.publishedAt)}</span>
                <span className="story-category">{article.category}</span>
              </div>
              <h3>
                <a href={article.url} target="_blank" rel="noreferrer">{article.title}</a>
              </h3>
              <a className="original-link" href={article.url} target="_blank" rel="noreferrer">
                Read original story <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>

        {data && (
          <footer className="feed-footer">
            {workingSources.length} of {data.sources.length} feeds available
            <span> · </span>
            Updated {formatDate(data.updatedAt)}
          </footer>
        )}
      </section>
    </main>
  );
}

export default App;
