# Pathway: Android and iOS roadmap

**Status:** Planning only. There is no verified Android or iOS native release, packaging implementation, or device QA in this repository.

## Goal
Retain the existing HTML/CSS/JavaScript/WebGL game as one source of gameplay behavior. Add platform packaging only after it demonstrably improves player access and can be tested without changing the web experience.

## Gate 1: Web baseline
- Pass `npm test` and `npm run build`.
- Play all 30 levels and verify win/next/reset behavior in a browser.
- Test touch accuracy, portrait/landscape sizing, visibility/resume, startup audio and performance on representative phones.
- Record real device and browser versions. Never infer compatibility solely from source code.

## Gate 2: Distribution rights
- Select and document a license for code.
- Identify soundtrack source/creator/license and confirm permission for repository and packaged-game distribution.
- Verify any bundled font/art licenses and attribution requirements.
- Avoid bundling unverified assets in a mobile distribution.

## Gate 3: Native feasibility
- Research candidate web-to-native packaging approaches, using the project's separate approved repository/tool workflow before selecting a dependency.
- Build an isolated prototype that preserves the browser game and keeps platform glue separate.
- Confirm WebGL, audio gesture policies, pointer/touch input, orientation changes, persistence, app lifecycle, offline asset loading, and accessibility on actual devices.
- Measure load time, frame rate, battery behavior and any platform-specific regressions.

## Gate 4: Platform-specific review
- Android: packaging/signing, target API rules, device matrix, permissions, Play Store policy.
- iOS: packaging/signing, iPhone/iPad device matrix, store review, privacy declarations, and meaningful app functionality.
- Treat store approval, compliance and commercial use rights as independent verification gates.

## Contribution candidates
- Repeatable manual QA checklist and bug templates.
- Small automated tests for reflection routes, geometry and progression.
- Device test reports for WebGL and Web Audio.
- Reproducible native packaging prototype after approved dependency selection.

**Not included:** Native scaffolding, SDKs, mobile dependencies, account credentials, signing material, or claims of app-store readiness.
