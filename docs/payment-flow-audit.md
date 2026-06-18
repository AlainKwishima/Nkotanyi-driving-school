# Payment Flow Audit

Date: June 16, 2026

## Scope

This review covered the mobile payment flow in the current repository plus safe, non-mutating checks against the live `https://www.ibyapa.com` API. No real payment initiation was performed, so this audit does not create charges or new transactions.

## Payment Flow Reviewed

- Plan selection in [screens/PaymentNativeScreens.tsx](C:/Users/kaeal/Documents/Nkotanyi-driving-school/screens/PaymentNativeScreens.tsx)
- Payment API integration in [services/paymentApi.ts](C:/Users/kaeal/Documents/Nkotanyi-driving-school/services/paymentApi.ts)
- Shared HTTP client in [services/api/client.ts](C:/Users/kaeal/Documents/Nkotanyi-driving-school/services/api/client.ts)
- Pending payment persistence in [services/pendingPaymentStore.ts](C:/Users/kaeal/Documents/Nkotanyi-driving-school/services/pendingPaymentStore.ts)
- Subscription/profile refresh in [context/AuthContext.tsx](C:/Users/kaeal/Documents/Nkotanyi-driving-school/context/AuthContext.tsx) and [services/userApi.ts](C:/Users/kaeal/Documents/Nkotanyi-driving-school/services/userApi.ts)
- Access-control enforcement in [utils/subscriptionAccess.ts](C:/Users/kaeal/Documents/Nkotanyi-driving-school/utils/subscriptionAccess.ts)

## Live API Findings

- Login works with `POST /api/user/login` when the payload uses `account`, not `phone`.
- The testing account `0789793334` currently logs in successfully and returns:
  - `role: "user"`
  - `permissions: []`
  - `user.language: "en"`
  - one active payment with:
    - `paymentStatus: true`
    - `subscription_type: "monthly"`
    - `language: "rw"`
    - `paymentMethod: "CARD"`
    - `subscriptionEnd: "2026-07-03T15:00:00.000Z"`
- Non-mutating status probes against `POST /api/payment/check-payment-status` authenticate successfully with the app's bearer token. Invalid references return backend `400` responses rather than auth failures.
- The stored active payment language on the backend does not match the profile language for this account. That mismatch is a backend/data issue and directly affects which language-gated content the app should consider unlocked.

## Issues Found

1. The mobile client only sent `Authorization` before this patch.
   Some ibyapa integrations still use the legacy `token` header in the web app. This could make payment endpoints behave differently across deployments.

2. Logout did not clear `hasSubscription`.
   A user could sign out while the local app state still remembered a paid subscription, which risks stale access state across sessions.

3. Payment response parsing was too narrow.
   The app already handled `reqRef`, but it did not recognize some common request/reference key variants when extracting payment references and user-facing failure reasons.

4. Failure messaging could collapse into a generic error.
   When the backend returned a structured error object during confirmation/polling, the UI could discard the useful backend message and show an unhelpful generic alert instead.

## Fixes Applied

- Added both `Authorization` and `token` bearer headers in the shared API client.
- Cleared `hasSubscription` during logout alongside the other subscription-related flags.
- Expanded payment reference parsing to include additional request/reference key variants.
- Added structured payment-message extraction so failed or cancelled payment checks surface more useful feedback.

## What Was Verified

- Plan selection passes `subscriptionType`, amount, and payment language through the mobile flow.
- Mobile payment requests send the same core fields as the production web app:
  - `amount`
  - `subscription_type`
  - `payment_method`
  - `lang`
  - `phone` for phone/card flows
- On successful payment confirmation, the app:
  - refreshes the server profile
  - updates local subscription state
  - stores subscription language
  - navigates to confirmation
- Pending payments are persisted locally and can be resumed later.
- A pending payment stored for another user is cleared instead of being reused incorrectly.

## Limits Of This Audit

- The backend source, webhook handlers, and database are not present in this repository, so they could not be code-reviewed directly.
- Because no real payment was initiated, webhook delivery, provider callbacks, database writes, and receipt generation could only be inferred from API contracts and existing stored payment records.
- The live backend currently shows a real payment record whose language is `rw` for a profile whose selected app language is `en`. That is a backend data/source-of-truth problem, not something the mobile app can safely rewrite on its own.

## Recommended Backend Follow-up

- Confirm whether payment creation is expected to persist `language/lang` onto the payment row for English and French purchases.
- Confirm whether the webhook or post-payment reconciliation step ever overwrites the purchased content language with the user's previous/default language.
- Confirm whether `check-payment-status` always returns `reqRef` for initiated payments. The mobile flow depends on that identifier for resume/poll behavior, just like the production web app.
