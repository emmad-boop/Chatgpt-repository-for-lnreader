# LNReader FanFiction.net plugin

An English FanFiction.net plugin distributed in the LNReader v3 plugin-index shape.

## Plugin index entry

The repository-level `plugins.min.json` contains the entry that an LNReader plugin index can consume. Its fields are deliberately kept to the v3 index convention: `id`, `name`, `site`, `lang`, `version`, `url`, and `iconUrl`.

## Raw install assets

- Plugin: `https://raw.githubusercontent.com/emmad-boop/Chatgpt-repository-for-lnreader/main/.js/src/plugins/english/FanFictionNet.js`
- Icon: `https://raw.githubusercontent.com/emmad-boop/Chatgpt-repository-for-lnreader/main/public/static/english/fanfictionnet/icon.svg`
- Index entry: `https://raw.githubusercontent.com/emmad-boop/Chatgpt-repository-for-lnreader/main/plugins.min.json`

## Development

```sh
npm run typecheck
npm test
```

The checked-in plugin output is generated from `src/index.ts` by `npm run build`. It uses only FanFiction.net's public pages and does not attempt to bypass access controls.
