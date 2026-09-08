# Magic Keys

[Open the app](https://magic-keys.alirezaafshan.chatgpt.site) · [Reference firmware](https://github.com/YesterdaysLemon/magic-keys/releases/tag/v0.1.0)

A keyboard layout editor and context-sensitive key programmer. Give Magic and Repeat different behaviors based on the previous key, test them in a playground, and generate firmware projects for exact hardware targets.

## First pass

- Planck rev6 (STM32F303): QMK, QMK + VIA, and Vial build projects.
- Urchin + nice!nano v2: ZMK build projects using the pinned Lemon antecedent-morph fork.
- QWERTY, Colemak-DH, Dvorak, and Magic Sturdy base layouts; individual key remapping.
- Separate Magic and adaptive Repeat cases, timing windows, text macros, cursor movement, and QMK Repeat continuations.
- Plain-language case grammar: `after i type "on"`, `space -> the`, one case per line. This first pass is a deterministic parser, not an LLM; unsupported descriptions fail without changing the project.
- Local browser persistence, JSON project import/export, full source ZIP export, and reproducible GitHub firmware workflows.

Run `npm ci`, `npm run dev`. Validate with `npm test`, `npm run typecheck`, and `npm run build`.

## Firmware is hardware-specific

A source ZIP is not a flash file. The Build firmware workflow compiles the generated Planck project into a BIN, with a SHA-256 checksum and the source project attached. The generated ZMK workflow produces left/right Urchin UF2 files. Never use one board revision's binary on another. No physical keyboard has been flashed as part of app development.

VIA and Vial are QMK configuration interfaces, not ZMK protocols. The Vial build embeds a definition with Magic and Repeat custom keys. VIA can assign them as `0x7E00` and `0x7E01`. Runtime remapping can move these keys; editing their case programs requires rebuilding. VIA/Vial EEPROM state can override compiled defaults, so reset the dynamic keymap after installing a new layout if necessary.

Macros assume a US host input layout. QMK cases are exact, case-sensitive preceding printable characters; shortcuts and navigation clear context. The playground models these QMK semantics. ZMK uses the fork's native antecedent HID context and native key-repeat fallback; its modifier and auto-repeat details differ. ZMK export rejects unsupported Repeat continuations explicitly. Arbitrary native code is not accepted in the editor. PCB design/export, arbitrary keyboard definitions, home-row mod programming, and direct USB flashing are future work.

## Provenance

Behavior recipes were recovered from:

- [Lemon's QMK keymap](https://github.com/YesterdaysLemon/qmk-keymap), particularly `getreuer_lemon.c`.
- [Lemon's ZMK config](https://github.com/YesterdaysLemon/zmk-config/tree/300a273c32866ae606fb0c80c496d0452b1c2c7f), `altrepeat.dtsi` and `macros.dtsi`.
- [Magic Sturdy](https://github.com/Ikcelaks/keyboard_layouts) and [Pascal Getreuer's keymap](https://github.com/getreuer/qmk-keymap).

The original ZMK Y case maps to Y despite its `yw` comment. This app preserves the actual code, not the comment. The separate QMK recipe preserves its own mappings; it does not pretend the QMK and ZMK recipes were identical.

The Urchin pinout files retain Duccio Breschi's MIT notices. QMK/Vial firmware retains its upstream GPL licensing; this app and original generator code are MIT. Upstream revisions are pinned in `lib/engine.mjs` and workflows.

## Hosting and cost

Designed for the user's [Deploy Manager](https://github.com/YesterdaysLemon/deploy-manager), with a Dockerfile, `/healthz`, signed CI release notification, and candidate/production health checks. Do not mistake a deployment acceptance for a completed release.

The repository is public. CI uses standard Ubuntu runners, never paid larger runners. Firmware jobs are on demand; artifacts have short retention. GitHub artifact storage is still separately metered even when public-repository runner minutes are free.

## Verification checkpoint — 2026-09-08

13 automated checks pass, including compilation and execution of the generated C in a native harness. The deployment Docker image passes health and root-page checks in CI.

- [Planck rev6 + VIA build](https://github.com/YesterdaysLemon/magic-keys/actions/runs/34203959969): BIN produced.
- [Planck rev6 + Vial build](https://github.com/YesterdaysLemon/magic-keys/actions/runs/34204611023): BIN produced, embedded definition included.
- [Urchin left/right ZMK build](https://github.com/YesterdaysLemon/magic-keys/actions/runs/34203888129): both UF2s produced.

Reference release archives include the exact project and binary hashes. These are compiler-verified reference files, not a claim of physical keyboard testing. Custom projects must be built separately. The optional WebMCP tools have contract tests; a live browser WebMCP runtime was not verified.
