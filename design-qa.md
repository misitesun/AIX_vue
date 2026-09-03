# Recharge QR layout QA

- Source visual truth: `/var/folders/py/18yf1bmx1w9f1z5fx19j4nm80000gn/T/codex-clipboard-b85f951c-aeea-4163-9a6f-09b04c0cf4f2.png`
- Reported broken-state screenshot: `/var/folders/py/18yf1bmx1w9f1z5fx19j4nm80000gn/T/codex-clipboard-aacc7cc9-d969-4137-b0d9-b63865a141ea.png`
- Browser-rendered implementation screenshot: `/private/tmp/asset-recharge-qr-fixed-375x812.jpg`
- Focused comparison: `/private/tmp/asset-recharge-qr-comparison.png`
- Route: `http://192.168.110.102:8080/h5/assets/usdt/recharge`
- Viewport: 375 × 812 CSS px; implementation capture 375 × 812 px at browser capture density 1.
- Source dimensions: 864 × 1780 px. The QR regions from both images were cropped and normalized to equal 620 × 620 px panels for focused comparison.
- State: USDT selected, BEP20 selected, recharge address loaded, QR code visible.

**Findings**

- No remaining P0, P1, or P2 issue in the QR region. The QR image is complete, square, centered in its white container, and centered within the four blue corner assets.
- Fonts and typography: unchanged by this fix; the recharge screen hierarchy and warning text remain consistent with the existing implementation.
- Spacing and layout rhythm: QR-to-frame spacing is balanced on both axes at the tested mobile viewport. No horizontal overflow or clipping is visible.
- Colors and visual tokens: black page background, white QR card, and blue corner assets match the source treatment.
- Image quality and asset fidelity: existing SVG corner assets remain sharp. The generated QR image is displayed once at its intended square size.
- Copy and content: unchanged. The current product requirement intentionally hides the amount input and confirmation button shown in the older source screenshot.

**Focused comparison evidence**

- A focused side-by-side comparison was required because the issue concerned the generated QR node rather than the rest of the screen.
- The source and fixed crops both show a complete QR code with an intact bottom finder pattern and white padding on all four sides.

**Full-view comparison evidence**

- The browser-rendered 375 × 812 capture shows the complete recharge information card, centered QR frame, and warning copy without overlap.
- The older source contains amount controls that were intentionally removed by a later requirement; this difference is not design drift for the QR fix.

**Comparison history**

1. Earlier finding — P1: `qrcodejs2` creates both a canvas and an image, but the page forced both children to `display: block !important`. They stacked vertically inside a fixed-height, overflow-hidden wrapper, exposing a second partial QR and making the bottom appear clipped.
2. Fix made: removed the forced shared display rule, preserved the library's canvas/image visibility switch, and kept both possible renderers at the intended square dimensions.
3. Post-fix evidence: at the default mobile viewport the QR wrapper measured 187 × 187 px, its canvas computed to `display: none`, and the single visible image measured 156 × 156 px. The 375 × 812 responsive capture also shows the complete code centered without clipping.

**Interaction and runtime checks**

- Opened the recharge-chain selector and selected BEP20.
- Confirmed that the QR region appears only after chain selection.
- Confirmed that the QR remains complete at a 375 × 812 mobile viewport.
- Browser console errors: none.
- Production build: passed.

**Open Questions**

- None for this scoped fix.

**Implementation Checklist**

- [x] Show only one QR renderer.
- [x] Preserve square QR dimensions and white padding.
- [x] Verify centering inside the scan frame.
- [x] Verify a narrow mobile viewport.
- [x] Check browser console and production build.

**Follow-up Polish**

- None required for the reported QR layout issue.

final result: passed

---

# Account binding settings QA

- Source visual truth: `/var/folders/py/18yf1bmx1w9f1z5fx19j4nm80000gn/T/codex-clipboard-3ef6c32b-9250-468a-8413-9684326a3a59.png`
- Intended state: dark mobile settings page with an added account-information section; wallet accounts without an email can bind an email, and email accounts without an address can bind a wallet address.
- Implementation target: `/settings`, `/settings/bind-email`, and `/settings/bind-wallet-address`.
- Implementation screenshot: not captured.
- Viewport and density normalization: not available because the browser-control runtime was not exposed in this session.

**Findings**

- [P1] Rendered visual comparison is blocked.
  Location: account-information and account-binding routes.
  Evidence: the source screenshot is available, but no browser-control runtime is available to capture the locally rendered Vue routes at the matched mobile viewport.
  Impact: spacing, typography, and the responsive placement of the added module cannot be visually accepted from source code or the successful production build alone.
  Fix: open the local app in a browser-enabled session, capture the same settings state at a matched mobile viewport, then compare it with the source screenshot and iterate on any P0–P2 differences.

**Required fidelity surfaces**

- Fonts and typography: blocked pending a rendered capture.
- Spacing and layout rhythm: blocked pending a rendered capture.
- Colors and visual tokens: blocked pending a rendered capture.
- Image quality and asset fidelity: existing project SVG assets are reused; final visual confirmation is blocked pending a rendered capture.
- Copy and content: routes and localized labels compiled successfully; final visual confirmation is blocked pending a rendered capture.

**Implementation Checklist**

- [x] Add account-information entries that react to the current `email` and `address` fields.
- [x] Add the email binding form using `POST /api/users/my/email` and email-code type 6.
- [x] Add the wallet-address binding form using `POST /api/users/my/address` and email-code type 7.
- [x] Build the project successfully.
- [ ] Capture and compare the rendered mobile routes in a browser-enabled session.

**Open Questions**

- The bind-wallet API requires a Google verification code. The page supplies that field; the account should already have Google 2FA available before the request can succeed.

final result: blocked
