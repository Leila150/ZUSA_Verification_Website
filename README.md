# ZUSA Website

The official ZUSA web portal and account verification website.

## Authorized Use

**This website and its verification system are for official ZUSA use only.**

Do not copy, reproduce, modify, redistribute, deploy, or use this website or any part of its verification system unless authorized by the **owners of ZUSA**.

Unauthorized use of the ZUSA branding, verification interface, website code, or related materials is not permitted.

## Routes

- `/` — ZUSA main website
- `/verification/` — Verification success page
- `/privacy-policy/` — Privacy Policy
- `/terms-of-service/` — Terms of Service

## Design

The website uses a clean, dark ZUSA-themed design shared across the main portal, verification page, and legal pages.

The verification page intentionally remains a simple verification-success screen with the original ZUSA branding, success check mark, message, and footer.

## Structure

```text
ZUSA_Verification_Website/
├── public/
│   ├── index.html
│   ├── style.css
│   ├── zusa-icon.png
│   ├── verification/
│   │   └── index.html
│   ├── privacy-policy/
│   │   └── index.html
│   └── terms-of-service/
│       └── index.html
├── netlify.toml
├── .gitignore
└── README.md
```

## Netlify

The site is configured to publish from the `public/` directory using `netlify.toml`.

## Roblox OAuth

The verification page is intended to become the visual success page for the ZUSA Roblox OAuth verification flow.

The Roblox OAuth authorization-code exchange must be handled by a server-side component or secure edge/serverless function. Never expose a Roblox client secret in HTML, CSS, or browser-side JavaScript.

## Rights

ZUSA Property | All Rights Reserved

Copyright © 2026 Zero's United States Army.
All Rights Reserved.

Third-party services and trademarks remain the property of their respective owners.
