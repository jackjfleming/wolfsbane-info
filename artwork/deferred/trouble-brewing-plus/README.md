# Trouble Brewing +: approved artwork, deferred installation

Approved October 16, 2026. Keep the existing icons active until Jack can print replacement tokens and explicitly requests activation. Artwork approval does not authorize installing or deploying these designs.

This folder is the retained source for all 34 approved alternatives. The final Thief has a bold dollar sign on the bag. The final Poisoner uses the square bottle and pouring drop. Evil Twin now has a kind, happy back mask and a sinister front mask, revised at Jack's request. The other 31 alternatives match the reviewed set.

## Preview and print

Open [review.html](review.html) directly in a browser. It is self-contained and needs no local server. It shows each existing icon beside its approved alternative, with search and matched artwork sizes. [revised-thief-poisoner.png](revised-thief-poisoner.png) shows the final two revisions.

`svg/` contains the 34 print and engraving source files. `originals/` preserves the existing Trouble Brewing + artwork for comparison and rollback. `manifest.json` records exact runtime filenames, candidate SHA-256 hashes, original artwork hashes, and the production baseline.

The SVGs use a 512 by 512 viewBox and a single black compound path with transparent cutouts. Check dimensions and minimum feature widths in the printing or laser software. Detached details need a supporting base for relief tokens. No physical print tests have been performed.

## Activate later

1. Ask Jack which roles have replacement tokens ready. Activation may be role by role or all 34. Do not infer activation from this approval record.
2. Verify the selected candidate hashes against `validation.candidate_sha256` in the manifest. Compare the current runtime files with `originals/` and the baseline hashes; reconcile any artwork changes made since this archive was saved.
3. For each selected role, use the exact filename in `runtime_filenames`. Copy its `svg/<filename>` to `wolfsbane/public/images/<filename>`. Replace the matching file in `wolfsbane-info/images/<filename>` when it already exists. Preserve all other roles and unrelated working changes. No code or role mapping changes are required.
4. Render and inspect the selected runtime files, check both apps, then commit only the selected artwork paths. Push and deploy only when Jack requests that release. Confirm both live sites serve the selected SVG bytes.
5. Record the activated roles and release commits here. Keep `originals/` for rollback and leave any unselected alternatives deferred.

## Current state

All 34 alternatives are saved here for later use. None is installed in either runtime icon directory. The 227 current app and reference SVGs were checked against their post-release baseline and remain unchanged.
