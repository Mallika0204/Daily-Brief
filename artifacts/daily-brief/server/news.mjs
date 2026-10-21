import { XMLParser } from 'fast-xml-parser';

export const FEEDS = [
  {
    id: 'hindu-india',
    publisher: 'The Hindu',
    section: 'India',
    category: 'India',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    allowedHost: 'thehindu.com',
  },
  {
    id: 'bbc-world',
    publisher: 'BBC News',
    section: 'World',
    category: 'World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    allowedHost: 'bbc.co.uk',
  },
  {
    id: 'hindu-world',
    publisher: 'The Hindu',
    section: 'World',
    category: 'World',
    url: 'https://www.thehindu.com/news/international/feeder/default.rss',
    allowedHost: 'thehindu.com',
  },
  {
    id: 'bbc-business',
    publisher: 'BBC News',
    section: 'Business',
    category: 'Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    allowedHost: 'bbc.co.uk',
  },
  {
    id: 'hindu-business',
    publisher: 'The Hindu',
    section: 'Business',
    category: 'Business',
    url: 'https://www.thehindu.com/business/feeder/default.rss',
    allowedHost: 'thehindu.com',
  },
  {
    id: 'bbc-technology',
    publisher: 'BBC News',
    section: 'Technology',
    category: 'Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    allowedHost: 'bbc.co.uk',
  },
  {
    id: 'hindu-technology',
    publisher: 'The Hindu',
    section: 'Technology',
    category: 'Technology',
    url: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss',
    allowedHost: 'thehindu.com',
  },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
});

function text(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return text(value[0]);
  if (value && typeof value === 'object') {
    return text(value['#text'] ?? value['#cdata'] ?? value);
  }
  return '';
}

function cleanTitle(value) {
  return text(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function articleLink(item, allowedHost) {
  const rawLink = text(item.link) || text(item.guid);
  try {
    const url = new URL(rawLink);
    if (
      url.protocol !== 'https:' ||
      !(url.hostname === allowedHost || url.hostname.endsWith(`.${allowedHost}`))
    ) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function parseFeed(xml, feed) {
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel;
  if (!channel) throw new Error('Feed did not contain an RSS channel.');

  const rawItems = channel.item == null
    ? []
    : Array.isArray(channel.item) ? channel.item : [channel.item];
  const articles = rawItems.flatMap((item) => {
    const title = cleanTitle(item.title);
    const url = articleLink(item, feed.allowedHost);
    if (!title || !url) return [];
    const rawDate = text(item.pubDate) || text(item.published) || text(item.date);
    const timestamp = Date.parse(rawDate);
    return [{
      id: url,
      title,
      url,
      source: feed.publisher,
      sourceUrl: feed.publisher === 'BBC News'
        ? 'https://www.bbc.com/news'
        : 'https://www.thehindu.com/',
      category: feed.category,
      section: feed.section,
      publishedAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
    }];
  });

  return { articles, channelTitle: text(channel.title) };
}

export async function loadNews(fetchImpl = fetch) {
  const results = await Promise.all(FEEDS.map(async (feed) => {
    try {
      const response = await fetchImpl(feed.url, {
        headers: { accept: 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { articles, channelTitle } = parseFeed(await response.text(), feed);
      return {
        source: feed.publisher,
        section: feed.section,
        category: feed.category,
        url: feed.url,
        channelTitle,
        ok: true,
        count: articles.length,
        error: null,
        articles,
      };
    } catch (error) {
      return {
        source: feed.publisher,
        section: feed.section,
        category: feed.category,
        url: feed.url,
        ok: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Feed could not be loaded.',
        articles: [],
      };
    }
  }));

  const seen = new Set();
  const articles = results
    .flatMap((result) => result.articles)
    .filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    })
    .sort((a, b) => (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0));

  return {
    articles,
    sources: results.map(({ articles: _articles, ...source }) => source),
    updatedAt: new Date().toISOString(),
  };
}
