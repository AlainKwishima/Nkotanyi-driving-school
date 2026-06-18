# Backend PDF Language Issue

Verified against the production API on June 15, 2026.

Rechecked on June 17, 2026 with the same testing account after reviewing the screen recording. The current production response still returns only `language: "rw"` records for `language=en`, `language=fr`, and `language=rw`.

## User endpoint

`GET /api/pdf/get-all-pdf`

The endpoint is authenticated and subscription-protected. The following requests were tested with an active full-access testing account:

- No query parameter
- `?language=en`, `?language=fr`, and `?language=rw`
- `?lang=en`, `?lang=fr`, and `?lang=rw`
- `language`, `lang`, `Accept-Language`, and `X-Language` request headers

Every successful request returned the same eight records, and every record had `language: "rw"`.

Changing the testing account's stored backend language to `en`, `fr`, and `rw` through `PATCH /api/user/update-user/:id` also did not change the PDF response. The original account language was restored after testing.

The test was repeated with a fresh login token containing `language: "en"`. The endpoint still returned only `language: "rw"` records, confirming this is not caused by a stale JWT.

## Admin endpoint

The production website exposes:

`GET /api/pdf/get-pdfs-admin?page=1&limit=10&q=&language=en`

The admin UI supports English, French, and Kinyarwanda PDF records. This endpoint rejects ordinary subscribed users with `401 not_authorized`, so it cannot safely be used by the mobile application.

## Required backend correction

The user-facing PDF endpoint must publish the English and French records and honor a documented language selector, preferably:

`GET /api/pdf/get-all-pdf?language=en|fr|rw`

Until that backend correction is deployed, the mobile app cannot retrieve English or French PDFs without bypassing backend authorization. The frontend now detects this mismatch and shows an accurate service error instead of a false empty-library message.

June 17 client mitigation: the Reading screen now retries the active subscription language when the selected language endpoint returns mismatched data. If that fallback succeeds, the app displays those available documents with a clear notice naming the requested language and the fallback language. This keeps users from hitting a dead end while preserving the fact that the backend still is not serving English/French PDFs through the user endpoint.
