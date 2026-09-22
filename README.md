# LNReader FanFiction.net

An English LNReader source for [FanFiction.net](https://www.fanfiction.net/). It uses ordinary public HTML requests only; it does not attempt to work around access controls.

## Features

- Title search with result pagination.
- Story metadata, author, optional cover, description, genres, completion state, and all chapters.
- Correct chapter URLs for `/s/<story-id>/<chapter>` links.
- Clean chapter extraction from FanFiction.net's `#storytext` container.
- Useful errors for invalid, unavailable, and empty stories/chapters.

## Installation

Install this repository through LNReader's extension/plugin repository flow. The plugin manifest is `manifest.json` and its compiled entry point is `dist/index.js`.

## Development

```sh
npm run typecheck
npm test
```

The build has no runtime npm dependencies. Network-level source smoke tests must be run from an environment that can reach `www.fanfiction.net`.
