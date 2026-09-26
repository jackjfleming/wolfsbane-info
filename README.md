# Wolf's Bane storyteller reference

This static site and the Game Master app use one editorial source: [`content/role-reference.json`](content/role-reference.json). It contains the 69 currently selectable characters. All entries are drafts until the Wolf's Bane rules owner reviews them.

## Review and publish

1. Open a generated role page to see its ruling, procedure, examples, source notes, and editorial questions. The canonical text is in `content/role-reference.json`.
2. For each role, resolve its `reviewNotes`, verify `shortRuling`, `howToRun`, and `interactions`, then set `reviewStatus` to `approved` with `reviewedBy` and an ISO `reviewedAt` date. Do this only after the rules owner approves that role.
3. Run `node scripts/build-reference.mjs` and `node --test scripts/test-reference.mjs` to regenerate and check the pages. `node scripts/build-reference.mjs --release` is the publication gate and fails while any role remains draft or has unresolved review notes.
4. Update the Game Master app's pinned bundle with `npm run reference:update -- /absolute/path/to/wolfsbane-info/reference-bundle.json` from the `wolfsbane` repository. Its build checks approval and catalog coverage independently.

The generator writes `index.html`, all role pages, `roles.json`, `reference-bundle.json`, and the player-facing `kiosk/roles-public.json`. Keep generated files in the same commit as the source change. GitHub Pages runs the release gate and checks for generation drift before deployment. Existing role URLs, including `roles/alpha-wolf.html`, remain valid.
