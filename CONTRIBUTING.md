# Contributing to Pathway

Pathway is a browser-based WebGL reflection puzzle game. **The current game is the starting point, not the ceiling.**

## Open innovation policy

All ideas are welcome when they can deliver a meaningful improvement, experiment, feature, design, tool, performance gain, accessibility gain, or useful extension. Contributors may challenge existing mechanics, graphics, architecture, platforms, and interaction patterns. The suggestions below are examples, **not limits**.

We assess a proposal by its potential and demonstrated value, not by how closely it resembles the existing game.

- Explain the user or developer benefit, or state a testable hypothesis for an experiment.
- Supply a working prototype, demonstration, test, benchmark, design study, or clear evaluation plan appropriate to the proposal.
- Describe tradeoffs, compatibility impact, and how to reproduce results.
- Keep the released game functional while experimenting: disruptive changes can be developed independently and reviewed before integration.
- Separate experimental claims from verified results. A successful proposal need not preserve every existing design decision if the redesign has a compelling, demonstrated benefit.
- Respect third-party licensing and asset rights.

An unproven but promising experiment is welcome for exploration; it is not automatically approved for release. Maintainers decide whether, when, and how to integrate it.

## Getting started

1. Play the current build: https://pathway-game.vercel.app/
2. Review README.md for reflection rules, game structure, and beam simulation.
3. Clone the repository and serve its static files locally (for example `npx serve .`).
4. Run `npm test` and `npm run build` before submitting changes. These are source checks, **not** substitutes for actual browser tests.
5. For behavior changes, report mouse/touch devices and browsers actually tested.

## Possible contributions (non-exhaustive)

- New puzzles, mechanics, interactive systems, or alternative game modes
- Visual direction, animation, rendering, sound interaction, and UX experiments
- Editors, procedural tools, level generators, and developer APIs
- Performance, memory, battery efficiency, accessibility, and localization
- New platforms, including Android/iOS investigations and device prototypes
- Gameplay fixes, test automation, and progression improvements
- Entirely new approaches backed by usable prototypes or evidence

For platform work, see MOBILE_ROADMAP.md; no native packaging is currently verified in this repository.

## Proposals and pull requests

Open a GitHub issue describing the idea, expected benefit, and a lightweight method to evaluate it. For a pull request, explain what changed, why it matters, what was tested, and any known limitations. Focused PRs are easier to review, but larger innovations can be scoped and discussed in stages.

Do not silently replace existing assets or break shipped functionality. When intentionally proposing a redesign, make the tradeoffs explicit and provide a reviewable demonstration. Do not claim hardware testing or performance improvements without evidence.

## Licensing and assets

The repository is public but has no verified repository-wide open-source license. **Public access does not grant permission to reuse or redistribute the code or assets.** Confirm contributor and distribution rights with the maintainer before incorporating contributions.

The music's source links and commercial/redistribution rights remain under investigation; do not treat any of the bundled MP3/M4A versions as freely reusable or sublicense them. The font and other asset rights also require verification. See ASSET_RIGHTS.md.

Use GitHub issues to propose improvements or report bugs, and do not submit unlicensed third-party material.
