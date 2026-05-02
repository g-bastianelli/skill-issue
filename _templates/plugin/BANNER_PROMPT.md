<!-- template-meta
required:
  - README banner guidance for generated images
  - mascot/persona must be visible
  - match existing nuthouse banner style
  - 3:1 wide banner target
  - no readable text unless exact English text is explicitly requested
  - preserve replaced banners as banner-old.png
-->

# {{plugin}} banner prompt

Use this prompt to generate `{{plugin}}/assets/banner.png`.

```text
Wide GitHub README banner for the `{{plugin}}` plugin, 3:1 aspect ratio,
matching the existing nuthouse plugin banners: playful hand-drawn webcomic
mascot illustration, no readable text unless exact English text is requested.

Main subject: a clear persona/creature/being for `{{plugin}}`.
Persona tagline: "{{tagline}}".

Composition: mascot on the left or left-center, roomy negative space on the
right for README/title breathing room. Soft off-white or pale pastel background
with subtle paper texture. Thick black outlines, simple cel shading, expressive
face, funny props connected to what the plugin does, readable at README size,
playful absurd details, light brainrot energy.

Avoid photorealism, dark neon poster style, luxury fantasy composition,
serious cinematic lighting, full-bleed clutter, tiny over-detailed UI panels,
corporate SaaS polish, logos, watermarks, and any readable words.
```

If replacing an existing nice banner, keep it as `assets/banner-old.png`
before writing the new `assets/banner.png`.
