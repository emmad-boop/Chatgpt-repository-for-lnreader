const BASE_URL = 'https://www.fanfiction.net';
const headers = { 'User-Agent': 'LNReader FanFiction.net extension', Accept: 'text/html,application/xhtml+xml' };
function text(value) {
    const plain = value.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ').replace(/\r/g, '');
    return decodeEntities(plain.split('\n').map(line => line.replace(/[ \t]{2,}/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim());
}
function decodeEntities(value) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (all, entity) => {
        if (entity[0] === '#') {
            const n = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
            return Number.isFinite(n) ? String.fromCodePoint(n) : all;
        }
        return entities[entity.toLowerCase()] ?? all;
    });
}
function attr(tag, name) {
    const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
    return match?.[2] ? decodeEntities(match[2]) : undefined;
}
function absolute(url) { return url ? new URL(url, BASE_URL).href : undefined; }
function storyUrl(value) {
    const match = value.match(/(?:https?:\/\/www\.fanfiction\.net)?\/s\/(\d+)(?:\/(\d+))?/i);
    return match ? `${BASE_URL}/s/${match[1]}/${match[2] ?? '1'}` : undefined;
}
function blocks(html, className) {
    const start = new RegExp(`<div\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'gi');
    const result = [];
    let m;
    while ((m = start.exec(html))) {
        let pos = start.lastIndex, depth = 1, tag;
        const tags = /<\/?div\b[^>]*>/gi;
        tags.lastIndex = pos;
        while (depth && (tag = tags.exec(html))) {
            if (/^<\/div/i.test(tag[0]))
                depth--;
            else if (!/\/>$/.test(tag[0]))
                depth++;
            if (!depth)
                result.push(html.slice(m.index, tags.lastIndex));
        }
        start.lastIndex = Math.max(pos, tags.lastIndex);
    }
    return result;
}
function first(re, value) { const m = re.exec(value); return m?.[1]; }
function metadata(raw) { const output = {}; for (const part of raw.split(/\s+-\s+/)) {
    const m = part.match(/^([^:]+):\s*(.+)$/);
    if (m)
        output[m[1].trim().toLowerCase()] = m[2].trim();
} return output; }
export class FanFictionNetSource {
    id = 'fanfictionnet';
    name = 'FanFiction.net';
    baseUrl = BASE_URL;
    lang = 'en';
    async fetchHtml(url) {
        const response = await fetch(url, { headers });
        if (!response.ok)
            throw new Error(response.status === 404 ? 'Story or chapter is unavailable.' : `FanFiction.net returned HTTP ${response.status}.`);
        return response.text();
    }
    parseCards(html) {
        return blocks(html, 'z-list').map(card => {
            const titleTag = card.match(/<a\b[^>]*class=["'][^"']*\bstitle\b[^"']*["'][^>]*>.*?<\/a>/is)?.[0];
            const titleAnchor = titleTag ?? first(/(<a\b[^>]*href=["'][^"']*\/s\/\d+[^"']*["'][^>]*>.*?<\/a>)/is, card);
            const href = titleAnchor && attr(titleAnchor, 'href');
            const name = titleAnchor && text(titleAnchor);
            if (!href || !name)
                return undefined;
            const imageTag = card.match(/<img\b[^>]*>/i)?.[0];
            const authorTag = card.match(/<a\b[^>]*href=["'][^"']*\/u\/\d+[^"']*["'][^>]*>.*?<\/a>/is)?.[0];
            const summary = first(/<div\b[^>]*class=["'][^"']*\bz-padtop\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, card);
            const info = first(/<div\b[^>]*class=["'][^"']*\bz-padtop2\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, card);
            return { name, url: absolute(href), cover: absolute(attr(imageTag ?? '', 'data-original') ?? attr(imageTag ?? '', 'src')), author: authorTag ? text(authorTag) : undefined, description: summary ? text(summary) : undefined, metadata: info ? text(info) : undefined };
        }).filter((x) => Boolean(x));
    }
    async searchNovels(query, page = 1) {
        const url = new URL('/search/', BASE_URL);
        url.searchParams.set('keywords', query);
        url.searchParams.set('type', 'story');
        url.searchParams.set('match', 'title');
        url.searchParams.set('sort', '0');
        url.searchParams.set('ppage', '10');
        url.searchParams.set('page', String(page));
        const html = await this.fetchHtml(url.href);
        return { items: this.parseCards(html), hasNextPage: /[?&]page=(?:[2-9]|\d{2,})/.test(html) };
    }
    async getPopularNovels(page = 1) { return this.searchNovels('', page); }
    async getLatestNovels(page = 1) { return this.searchNovels('', page); }
    async getNovel(input) {
        const canonical = storyUrl(input);
        if (!canonical)
            throw new Error('This is not a valid FanFiction.net story URL.');
        const html = await this.fetchHtml(canonical);
        const titleTag = first(/<(?:b|h1)\b[^>]*class=["'][^"']*\bxcontrast_txt\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:b|h1)>/i, html);
        const name = titleTag ? text(titleTag) : undefined;
        if (!name)
            throw new Error('Story is unavailable or its page format has changed.');
        const authorTag = html.match(/<a\b[^>]*href=["'][^"']*\/u\/\d+[^"']*["'][^>]*>.*?<\/a>/is)?.[0];
        const imageTag = html.match(/<img\b[^>]*(?:data-original|src)=[^>]*>/i)?.[0];
        const description = first(/<div\b[^>]*class=["'][^"']*\bxcontrast_txt\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, html);
        const info = text(first(/<span\b[^>]*class=["'][^"']*\bxgray\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i, html) ?? '');
        const fields = metadata(info);
        const chapters = [];
        const select = first(/<select\b[^>]*name=["']chapter["'][^>]*>([\s\S]*?)<\/select>/i, html);
        if (select) {
            const options = select.match(/<option\b[^>]*>.*?<\/option>/gis) ?? [];
            options.forEach((option, i) => { const value = attr(option, 'value'); if (value)
                chapters.push({ name: text(option), number: i + 1, url: `${BASE_URL}/s/${canonical.match(/\/s\/(\d+)/)[1]}/${value.split('/')[0]}` }); });
        }
        if (!chapters.length)
            chapters.push({ name: 'Chapter 1', number: 1, url: canonical });
        const genres = (fields['genres'] ?? '').split('/').map(x => x.trim()).filter(Boolean);
        const status = /complete/i.test(info) ? 'completed' : /updated|published/i.test(info) ? 'ongoing' : 'unknown';
        return { name, url: canonical, cover: absolute(attr(imageTag ?? '', 'data-original') ?? attr(imageTag ?? '', 'src')), author: authorTag ? text(authorTag) : undefined, description: description ? text(description) : undefined, metadata: fields, genres, status, chapters };
    }
    async getChapterContent(input) {
        const canonical = storyUrl(input);
        if (!canonical)
            throw new Error('This is not a valid FanFiction.net chapter URL.');
        const html = await this.fetchHtml(canonical);
        const content = first(/<div\b[^>]*id=["']storytext["'][^>]*>([\s\S]*?)<\/div>/i, html);
        if (!content)
            throw new Error('Chapter text is unavailable.');
        const value = text(content);
        if (!value)
            throw new Error('Chapter text is empty.');
        return value;
    }
}
const source = new FanFictionNetSource();
export default source;
