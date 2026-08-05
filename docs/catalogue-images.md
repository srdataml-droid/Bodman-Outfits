# Catalogue image naming contract

The authoritative answer to "what do I name the files". Derived from
`apps/web/lib/garments.ts`, which is the source of truth — if this document
and that file ever disagree, the file wins.

## Pattern

```
apps/web/public/images/catalogue/{slug}-flat.png
apps/web/public/images/catalogue/{slug}-on-form.png
```

**There is no `suit-` or garment-type prefix.** The file is named for the
garment's own slug: `navy-two-piece-flat.png`, never
`suit-navy-two-piece-flat.png`.

Category images take a `category-` prefix, because the category slug and a
garment slug could otherwise collide: `category-suits-flat.png`.

## Specification

| Property | Value |
|---|---|
| Format | PNG |
| Dimensions | 512 × 640 (4:5) |
| Pairing | `flat` and `on-form` **must** share an aspect ratio |

The pair requirement is not cosmetic. `GarmentFigure` crossfades the two
images on hover and focus; a mismatched ratio makes the garment jump, which is
exactly the attention-seeking motion this design avoids.

`flat` is the garment laid out or shot as detail and is the **resting** state,
so it has to stand on its own — touch devices have no hover and will often
never see the second image. `on-form` is the same garment dressed on a form.

## Every referenced file

Twenty files, ten pairs.

**Categories** (5 pairs) — `category-suits`, `category-agbada`,
`category-kaftan`, `category-casuals`, `category-corporate`, each `-flat.png`
and `-on-form.png`. All ten currently exist.

**Garments** (5 pairs):

| Slug | Line | Status |
|---|---|---|
| `navy-two-piece` | Suits | exists |
| `charcoal-three-piece` | Suits | exists |
| `ivory-wedding-suit` | Suits | exists |
| `casual-full` | Casuals | placeholder only — **still to generate** |
| `corporate-full` | Corporate | placeholder only — **still to generate** |

So the outstanding batch is exactly four files:

```
casual-full-flat.png       casual-full-on-form.png
corporate-full-flat.png    corporate-full-on-form.png
```

**These four currently hold generated stand-ins**, added 2026-08-05 because
their absence was rendering a broken-image icon and raw alt text across four
live pages. They are 512×640 and match the existing design-system placeholder
style (tan-to-sage ground and cream cloth for `flat`, everglade ground and
sage cloth for `on-form`, copper accent rule). **Overwrite them in place** —
same filenames, same directory, no code change needed.

Both should depict a **complete outfit, shirt and trousers together** — not a
shirt alone and not trousers alone. That is the whole point of the 2026-08-05
change: each of those two lines is one outfit, priced as one outfit.

## Do not generate

**Agbada and kaftan garment images.** Those lines have category images only.
No individual garment entries exist for them, deliberately — inventing garment
names and descriptions for lines nobody has described would be inventing
product. The category pages say so honestly instead.

## Orphaned files

Nineteen files in `images/catalogue/` are referenced by nothing:

```
category-casual-flat.png / -on-form.png      (singular; the slug is "casuals")
shirt-flat.png / -on-form.png                (orphaned 2026-08-05)
trousers-flat.png / -on-form.png             (orphaned 2026-08-05)
flat-front-trouser-*, formal-wear.png, linen-shirt-*, oxford-shirt-*,
relaxed-chino-*, tailored-blazer-*, weekend-overshirt-*
```

None have been deleted. `shirt-*` and `trousers-*` became orphaned when
casuals and corporate collapsed to one outfit each; the rest predate that.
