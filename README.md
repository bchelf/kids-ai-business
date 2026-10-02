# Business Kids

An interactive AI startup studio for ages 9–12. Children choose their customer, product, value, name, brand, price, first customer and marketing approach, then create a launch blueprint and an editable website preview.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000/kids-business. The root route also leads to the studio.

Keep `OPENAI_API_KEY` in `.env.local`. It is read only by server-side API code. The existing defaults are `gpt-5.6-luna` for structured coaching/copy and `gpt-image-2` for logos. Optional server-only `OPENAI_TEXT_MODEL` and `OPENAI_IMAGE_MODEL` variables can override them for models available to your account. Real requests incur OpenAI usage; there are no simulated AI success responses.

## Verify

```sh
npm run lint
npm run build
npm run start
```

The production build uses Next.js's supported Webpack compiler because Turbopack's build workers cannot bind ports in the restricted execution environment. Development keeps the existing `next dev` configuration. The existing App Router font configuration fetches Geist during a build and needs network access.

## Implementation

- `pages/kids-business.js` owns structured business state, wizard navigation, request handling and browser persistence.
- `components/StudioUI.js`, `components/steps/BrandStep.js` and `components/Blueprint.js` render the decision studio.
- `pages/api/coach.js`, `generate-logo.js` and `generate-website.js` call OpenAI server-side. The old `generate-ideas` URL now points to the structured coach.
- `lib/business.js` validates business/website data; `lib/server/ai.js` owns the server-only SDK integration.
- `components/website/` renders three owned React templates and a browser-frame preview with copy, template, color, logo-size and AI instruction editing. AI never produces executable code.
- `lib/persistence.js` saves multiple independent projects (including their logos) in IndexedDB. My ideas opens the project library; New idea saves the current business before starting another. Keep building restores the selected project's exact step, answers, AI choices, logo and website. The previous single-project save is migrated automatically. The header includes a Save idea button and saved status. Saves stay in the same browser on this device; they do not sync between browsers. Deleting a project requires confirmation, and storage failures preserve the in-tab work.

Nothing is published, no domains are registered, and the preview does not accept payments. Guardians should help with spending, selling, accounts, taxes and any eventual publishing. The existing transparent Business Kids corporate logo is preserved separately from generated business logos.
