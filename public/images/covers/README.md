# Magazine cover scans

Put cover images for the coffee-table flip-through here (web viewer and AR lens).

- **Format:** JPG or WebP, portrait, about 800 px wide (keeps the AR lens fast).
- **Name them simply:** e.g. `jet-1972-06-15.jpg`, `ebony-1975-08.jpg`.
- **Hook them up** in `src/data/frequencies.js` → `MAGAZINES`:

```js
{
  masthead: 'JET',
  date: 'June 15, 1972',
  coverLine: 'The cover headline',
  story: 'Two to four sentences on the cover story and why it mattered.',
  image: 'images/covers/jet-1972-06-15.jpg',
  credit: 'Jet, Johnson Publishing Company',
  sourceUrl: 'https://…', // where the scan came from
},
```

The credit appears on the back of each cover, in the viewer caption, and in
**Credits & rights**. Entries without an `image` show a plain "cover coming soon" page.
