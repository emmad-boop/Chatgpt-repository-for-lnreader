import test from 'node:test';
import assert from 'node:assert/strict';
import source from '../dist/index.js';

test('rejects malformed story URLs before requesting them', async () => {
  await assert.rejects(() => source.getNovel('https://example.com/story/7'), /valid FanFiction/);
  await assert.rejects(() => source.getChapterContent('not-a-url'), /valid FanFiction/);
});

test('source exposes LNReader listing and reading operations', () => {
  for (const name of ['searchNovels', 'getPopularNovels', 'getLatestNovels', 'getNovel', 'getChapterContent']) {
    assert.equal(typeof source[name], 'function');
  }
  assert.equal(source.id, 'fanfictionnet');
  assert.equal(source.lang, 'en');
});

test('parses searches, full chapter lists, and clean chapter text', async () => {
  source.fetchHtml = async (url) => {
    if (url.includes('/search/')) return `<div class="z-list"><a class="stitle" href="/s/1234567/1/Example-Story">Example &amp; Story</a><a href="/u/88/Writer">Writer</a><img data-original="https://img.example/cover.jpg"><div class="z-padtop">A &quot;summary&quot;.</div><div class="z-padtop2">Rated: Fiction T - English - Adventure/Romance</div></div><a href="?page=2">Next</a>`;
    if (url.includes('/s/1234567/2')) return `<div id="storytext">Second paragraph.<br><br>Third &amp; final paragraph.</div>`;
    return `<b class="xcontrast_txt">Example &amp; Story</b><a href="/u/88/Writer">Writer</a><img src="/image/cover.jpg"><div class="xcontrast_txt">A <em>proper</em> description.</div><span class="xgray">Rated: Fiction T - English - Genres: Adventure/Romance - Chapters: 2 - Status: Complete</span><select name="chapter"><option value="1/Example-Story">1. Beginning</option><option value="2/Example-Story">2. Ending</option></select>`;
  };
  const results = await source.searchNovels('example');
  assert.equal(results.items[0].name, 'Example & Story');
  assert.equal(results.items[0].author, 'Writer');
  assert.equal(results.hasNextPage, true);
  const novel = await source.getNovel('https://www.fanfiction.net/s/1234567/1/Example-Story');
  assert.equal(novel.chapters.length, 2);
  assert.deepEqual(novel.chapters.map(c => c.number), [1, 2]);
  assert.equal(novel.chapters[1].url, 'https://www.fanfiction.net/s/1234567/2');
  assert.equal(novel.status, 'completed');
  assert.deepEqual(novel.genres, ['Adventure', 'Romance']);
  assert.equal(await source.getChapterContent(novel.chapters[1].url), 'Second paragraph.\n\nThird & final paragraph.');
});
