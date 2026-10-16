# Champs Kickboxing Club, website

A one-page static website for Champs Kickboxing Club in Palaio Faliro, in Greek with an English switch.
It uses plain HTML, CSS and JavaScript. There is nothing to install or build.

```
index.html        the whole page (all sections)
style.css         all styling
script.js         behaviour + the settings you will edit most (phone, rating, hours, timetable)
translations.js   all text in Greek (el) and English (en)
assets/img/       the photos and the logo used by the site
images/           your original photos (not used directly by the site)
```

To preview it, open `index.html` in a browser. Everything works from the file, except that the form only sends once it is connected (see below).

## Things still marked TODO

Search the files for `TODO`. In short:

| What | Where |
| --- | --- |
| Opening hours (currently placeholders) | `HOURS` in `script.js` **and** `openingHoursSpecification` in `index.html` |
| Class timetable (copied from the schedule poster, please confirm) | `TIMETABLE` in `script.js` |
| Stats (years open, classes, trainers) | the `stats` section in `index.html` |
| Trainer names, titles, bios, photos | `trainer.*` in `translations.js`, photos in `index.html` |
| Prices | `pricing` section in `index.html`, plan texts in `translations.js` |
| Form connection | the comment above `<form>` in `index.html` |
| Schedule PDF | upload it as `assets/schedule.pdf` |
| Website address for link previews | `og:url` / `og:image` in `index.html` |

## How to edit

### Text
All text is in `translations.js`, with each sentence under a key such as `"hero.sub"`, once under `el` and once under `en`.
Change the sentence there. The Greek text is also written in `index.html`, so the page shows correctly even before the script loads. If you change a Greek sentence, find the same key in `index.html` (for example `data-i18n="hero.sub"`) and change it there too.

### Opening hours
Open `script.js` and edit `HOURS` at the top. `0` is Sunday, `1` is Monday … `6` is Saturday, and `null` means closed:

```js
const HOURS = {
  1: ['17:00', '22:00'],
  ...
  0: null,
};
```

The top bar ("Open today …"), the hero summary and the hours list all update from this, using Athens time.
Then update the same hours in the JSON-LD block near the top of `index.html` (`openingHoursSpecification`), which is what Google reads.

### Timetable
Edit `TIMETABLE` in `script.js`. `slots` are the time rows. Each day lists one class per slot (`mixed`, `kids`, `cross`, `boxing`, `sparring`), or `null` for no class. The class names shown on the page are in `translations.js` under `tt.*`.

### Phone number, Google rating, Maps and Instagram
Edit `SITE` at the top of `script.js`. The script puts these into every link on the page.
Then search `index.html` for the old number or link and replace it too, so the page is correct before the script runs and for search engines (this includes the `telephone` line in the JSON-LD).

### Photos
1. Put the new photo in `assets/img/`. Keep it small: about 1200 px on the long side and under 250 KB as a JPG.
2. In `index.html`, change the `src`, the `width`/`height` and the `alt` text of the `<img>`.
3. If the photo has an `alt` translation (`data-i18n-attr="alt:alt.something"`), update that key in `translations.js` too.

The black-and-white look is added by CSS, so use normal colour photos. Photos of children belong only in the Kids card, in the classes section.

## Connecting the form

The free-trial form doesn't send anything yet. Until it is connected, visitors see a "please call us" message. Pick one option:

- **Formspree** (works on any host): create a free form at formspree.io and copy its ID. In `index.html`, replace `YOUR_FORM_ID` in the form's `action`.
- **Netlify Forms** (only if hosted on Netlify): in `index.html`, delete the `action="…"` attribute and add `data-netlify="true"` to the `<form>` tag. Submissions then appear in the Netlify dashboard under *Forms*.

## Deploying

The site is just these files. There is no build step.

- **Netlify:** drag the project folder onto app.netlify.com/drop, or connect the Git repository with an empty build command and `/` as the publish directory.
- **GitHub Pages:** push the repository to GitHub, then open *Settings → Pages* and choose *Deploy from a branch*, branch `main`, folder `/ (root)`.

After deploying, set `og:url` and `og:image` in `index.html` to the full addresses on your domain (for example `https://champs-kickboxing.gr/assets/img/og-image.jpg`), so link previews show the image.
