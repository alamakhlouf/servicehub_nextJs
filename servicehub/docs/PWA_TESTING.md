# PWA behavior and test scenarios

## What is implemented

The app registers `public/sw.js` from the shared layout, including on `localhost`. Service workers require a secure context; `localhost` and `127.0.0.1` are treated as secure for local development. Local development caches public API responses and visited public detail pages, but bypasses Next.js development assets so hot reload files are not served stale.

The worker uses versioned Cache Storage buckets:

- **Services, suppliers, and workshops:** network-first caching for allowlisted public catalogue APIs and visited detail pages. If the network fails, a cached response is returned with `X-ServiceHub-Cache: stale`.
- **Same-origin images:** cache-first for image requests under `/service-images/`, `/supplier-images/`, and `/workshop-images/`.
- **Production static files:** cache-first for same-origin scripts, styles, fonts, Next static assets, manifest, and icons. This cache is intentionally disabled on localhost.
- **Profiles:** network-first caching of `/api/profile?cacheUserId=<signed-in-user-id>`. The worker saves a response only if its returned user ID matches the cache key. The profile view also keeps a local snapshot keyed by user ID. Logout clears the worker's profile cache and the current user's local snapshot.
- **Booking requests:** while offline, a request is stored in IndexedDB and labeled Pending Sync; it is not shown as confirmed. The browser Background Sync API replays queued requests when supported. An online event or opening the app while online also replays them. A stable client request ID makes server retries idempotent. Failed requests remain available to retry from the bookings page.
- **Worker updates:** older ServiceHub caches are removed on activation. When an update is waiting, the app offers Refresh and tells the worker to activate; the page reloads when the new worker takes control.
- **Other offline drafts:** workshop participation requests, reviews, reports, and supplier listing forms have separate IndexedDB draft storage/workflows in the app. These are app-level offline features; the service worker does not cache their private API routes.
- **Notifications:** booking, supplier order, and workshop participation events create persistent in-app notifications for the provider, supplier, or workshop organizer. With browser notifications enabled, the server also sends Web Push to the creator's subscribed devices; the service worker displays the system notification and opens its destination when clicked. Browser permission and server VAPID keys are required.

The worker does not cache authenticated booking/order/report/review APIs or private page HTML. If an uncached page is refreshed offline, it serves the ServiceHub shell and keeps navigation available. The shell reads matching public catalogue/detail API responses from Cache Storage, or the account-keyed saved profile snapshot; if the route has no cached data it shows an offline message within the shell. Public detail API responses are only cached when the service/listing/workshop is actually published and visible. Profile data is available offline in the shell or still-open profile view after it has been saved on that device; a cold offline sign-in/profile visit is not supported. An online profile refresh failure is identified as a ServiceHub/server issue, not mislabeled as loss of internet access.

## Local test setup

1. Start the app from the `servicehub` directory with `npm run dev`.
2. Start the development server with `npm run dev`, visit `http://localhost:3000`, and wait for the service worker to install. Browser online status does not mean the local development server is running.
3. In Chrome/Edge DevTools, open **Application → Service Workers**. Confirm `/sw.js` is activated and controls the page. Localhost is supported without HTTPS.
4. Use **Application → Cache Storage** and **Application → IndexedDB** to inspect saved responses and offline queues.
5. To simulate a connection loss, use DevTools **Network → Offline**. Restore **No throttling** to simulate reconnection.

## Scenarios

### Local registration and update lifecycle

- On localhost, confirm `/sw.js` is active. The app should show the offline indicator after switching DevTools to Offline.
- With the app offline, load an uncached route and confirm the ServiceHub shell appears. Restore the connection; the shell should check the route and return to the app when it responds. If the browser says it is online but localhost refuses the connection, restart the development server.
- To test updates, change the worker script, reload once to install the new worker, and wait for the “ServiceHub has been updated” prompt. Choose **Refresh** and confirm the page reloads under the new controller. Change the cache version only when specifically testing removal of older `servicehub-*` caches.

### Public catalogue and detail caching

- While online, load a services, suppliers, or workshops catalogue and open a detail page.
- Switch to Offline and reload/visit the already loaded detail page or repeat the same catalogue API query. Cached public content should appear; it may be outdated.
- Inspect the network response headers for `X-ServiceHub-Cache: stale` when the service worker supplies a cached API/page response.
- In production, load a same-origin image once, switch offline, then reload the image request. Static files are cache-first in production only; localhost deliberately skips this cache.

### Profile cache and account separation

- Sign in, open **Profile** while online, and allow the `/api/profile?cacheUserId=...` request to complete.
- Switch offline while the profile view remains open. The saved profile should remain visible and the offline/stale notice should appear. A failed refresh uses the account-keyed local snapshot.
- Sign out, then inspect Cache Storage and localStorage: profile snapshots should be cleared. Sign in as another user and confirm the first user's profile is not displayed.
- With the browser still online but the app/API unavailable, the profile should say it couldn't refresh from ServiceHub rather than claiming the device is offline.
- Switch offline and refresh `/dashboard/profile`. The app navigation and frame should remain visible, with the local profile snapshot in the content area. A private profile HTML response is not cached.
- Refresh `/services`, `/suppliers`, or `/workshops` offline after loading the catalogues online. The shell should render matching cached cards; if the API was never cached, it should show the offline message inside the shell.

### Offline booking and automatic replay

- Sign in as a customer, open a published service booking form online, then switch Offline.
- Submit a future date/time. The form should say **Pending Sync** and the bookings IndexedDB store should contain the request; it must not claim provider acceptance.
- Restore the connection. The app should POST the saved request automatically. Confirm it appears once in the customer's bookings and the provider's booking requests, and that the queued entry disappears.
- Repeat with Background Sync unavailable or disabled: restoring the connection while the app is open should still replay it. Reopen the app while online to exercise the startup fallback.
- To test a rejected queued request, make its requested date invalid/expired before reconnecting. It should remain as **Sync failed** with an error and offer Retry Sync.

### Other offline drafts

- Open a workshop detail as a provider, switch offline, and request participation. It should say Pending Sync, then submit after reconnecting; the organizer should see the request.
- Open the report or review form offline and save a draft. Confirm it survives a reload in the same browser and remains labeled as a draft/pending action until successfully submitted online.
- As a supplier, edit a listing while offline and verify the saved listing draft can be restored. Draft storage alone does not publish changes.

### Creator notifications

- As a customer, book a provider's service. Sign in as that provider and confirm a new unread notification appears in navigation and **Notifications**, linking to booking requests.
- Place an order for a supplier listing. Sign in as that supplier and confirm the order notification links to supplier orders.
- As a provider, request to join another organizer's workshop. Sign in as the organizer and confirm the signup notification links to participants.
- Sign in as the notification recipient on a device/browser without an active push subscription. The app should show a **Turn on notifications?** prompt. Choose **Enable** and allow the browser permission prompt; browser permission must be requested after this click.
- Choose **Not now** and confirm the prompt stays dismissed for the current browser session. Start a new session and confirm it can ask again. If permission was blocked, allow it in browser/device site settings.
- Create one of the events above from another account and confirm a system notification appears. Test with the ServiceHub tab closed, then click the notification and confirm it opens the related page.
- The **Notifications** page also has a browser-notification toggle for enabling or disabling this device later.
- Choose **Turn off** and confirm later events no longer display on that device. Logging out also removes the current device's push subscription.

### Web Push server setup

- Configure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` on the server. Keep the private key secret; use the same key pair across application instances. `VAPID_SUBJECT` should be a `mailto:` contact or an HTTPS URL.
- Generate a key pair with `npx web-push generate-vapid-keys`. Set the public and private values in the server's environment and set a contact for the subject. Restart the server after changing environment values.
- Use HTTPS for deployed sites. `http://localhost` and `http://127.0.0.1` are trusted secure contexts for local browser testing. Browser push support and system notification display depend on browser and operating-system settings.
- Mark notifications read and confirm the unread count drops. Retry a request with the same client request ID and confirm it does not create duplicate booking/participation notifications.
