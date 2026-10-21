import assert from 'node:assert/strict';
import test from 'node:test';
import { FEEDS, loadNews, parseFeed } from './news.mjs';

const fixture = (host, suffix = 'one') => `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Sample publisher</title>
  <item>
    <title><![CDATA[Sample headline ${suffix}]]></title>
    <link>https://${host}/news/${suffix}</link>
    <pubDate>Tue, 20 Oct 2026 10:30:00 GMT</pubDate>
  </item>
</channel></rss>`;

test('parses headline, publisher, topic, date and original article URL', () => {
  const feed = FEEDS.find((source) => source.id === 'hindu-india');
  const result = parseFeed(fixture('www.thehindu.com'), feed);

  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].title, 'Sample headline one');
  assert.equal(result.articles[0].source, 'The Hindu');
  assert.equal(result.articles[0].category, 'India');
  assert.equal(result.articles[0].publishedAt, '2026-10-20T10:30:00.000Z');
  assert.equal(result.articles[0].url, 'https://www.thehindu.com/news/one');
});

test('drops article links outside the publisher domain', () => {
  const feed = FEEDS.find((source) => source.id === 'bbc-world');
  const result = parseFeed(fixture('example.com'), feed);
  assert.equal(result.articles.length, 0);
});

test('keeps healthy sources available when one RSS feed fails', async () => {
  const failedFeed = FEEDS[0];
  const result = await loadNews(async (url) => {
    const feed = FEEDS.find((source) => source.url === url);
    if (feed.id === failedFeed.id) throw new Error('connection refused');
    const host = feed.allowedHost === 'bbc.co.uk'
      ? 'www.bbc.co.uk'
      : 'www.thehindu.com';
    return {
      ok: true,
      text: async () => fixture(host, feed.id),
    };
  });

  assert.equal(result.sources.length, FEEDS.length);
  assert.equal(result.sources.filter((source) => source.ok).length, FEEDS.length - 1);
  assert.equal(result.sources.find((source) => source.url === failedFeed.url).ok, false);
  assert.equal(result.articles.length, FEEDS.length - 1);
});
