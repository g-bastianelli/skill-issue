<!-- template-meta
required:
  - README banner guidance for generated images
  - mascot/persona must be visible
  - match existing nuthouse banner style
  - setting must come from persona world
  - functional props are secondary
  - user-centered personas keep the user offscreen or abstract
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

Scene rule: the setting comes from the persona's world, not from a generic dev
workspace and not from the task domain alone. Make a cool little myth around
the character first. Then add a few secondary props connected to what the
plugin does.

If the persona is defined by a relationship to the user (devotee, servant,
worshipper, court jester, bodyguard, etc.), the user is the central power but
must stay offscreen, implied, or abstract. Do not invent a competing deity,
boss, or second mascot.

Composition: mascot on the left or left-center, roomy negative space on the
right for README/title breathing room. Background should come from the
persona's world too: it can be pale, loud, weird, cozy, occult, terminal-like,
or anything else that fits the character, as long as the banner stays readable
and not cluttered. Thick black outlines, simple cel shading, expressive face,
readable at README size, playful absurd details, light brainrot energy.

Avoid photorealism, dark neon poster style, luxury fantasy composition,
serious cinematic lighting, full-bleed clutter, tiny over-detailed UI panels,
corporate SaaS polish, logos, watermarks, and any readable words.
```

If replacing an existing nice banner, keep it as `assets/banner-old.png`
before writing the new `assets/banner.png`.
