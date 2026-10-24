# WalletX frontend/backend integration notes

This file is documentation only - nothing in `backend/` was changed.

## The one real gap: no way to fetch your own wallet ID or balance

Every backend route that returns wallet info was inspected:

- `GET /api/v1/users/me`, `POST /api/v1/auth/login`, `POST /api/v1/auth/register`
  all return the same normalized shape from `setUserCache`:
  `{ id, name, email, role, isActive }` - no wallet fields, no phone number.
- `GET /api/ledger` returns ledger entries (`date, transaction, description,
  debit, credit, balance, currency`) but never the wallet's `wallet_id`.
- `POST /api/v1/wallet` (create) only succeeds for a user with *no* wallet -
  and every account already gets one at registration
  (`backend/src/services/auth.service.js` calls `createWallet` inside the
  registration transaction), so this route 409s for every real user.
- The only two places `wallet_id` is ever returned in JSON are transient:
  a successful transfer response (`senderWalletId`) and a successful
  `POST /api/v1/wallet-security/set-pin` response (`walletId`).

**Practical effect:** a brand-new user who has never sent money or set a PIN
has no way to learn their own Wallet ID - which breaks the primary use case
of the Receive page (share your ID so someone can pay you *before* you've
ever transacted).

### What the frontend does about it (no backend change required)

`AuthContext` treats wallet info as "discovered" rather than "fetched":

- Balance is read from the newest ledger entry whenever the ledger is
  fetched (Dashboard, Transactions, Statement, or right after a transfer).
- Wallet ID is captured whenever it appears in a transfer or set-PIN
  response.
- Until either happens, Dashboard/Receive/Profile show an honest
  "not known yet" state instead of a fabricated `0` or blank ID.

This is a real, if awkward, path to a working session, but it can't help a
user who wants to receive money as their very first action.

### Suggested (optional) fix

A five-minute, additive endpoint using the model method that already exists
(`Wallet.findByUserId`, in `backend/src/models/wallet.model.js`):

```js
// backend/src/controllers/wallet.controller.js (add alongside createWallet)
export const getMyWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findByUserId(req.userId);

  if (!wallet) {
    return res.status(404).json({ success: false, message: "Wallet not found" });
  }

  res.status(200).json({
    success: true,
    wallet: {
      walletId: wallet.wallet_id,
      balance: wallet.balance,
      currency: wallet.currency,
      status: wallet.status,
    },
  });
});
```

```js
// backend/src/routes/wallet.routes.js
router.get("/me", authMiddleware, getMyWallet);
```

The frontend already calls `GET /api/v1/wallet/me` once per session
(`AuthContext.refresh`) and silently ignores a 404, so adding this route is
the only change needed to make Dashboard/Receive/Profile show full wallet
info immediately, with no frontend edits required.

## Notifications are never created server-side

`createNotification` (`backend/src/services/notification.service.js`) is
defined but not called anywhere in the codebase - not on transfer, not on
PIN creation, nothing. So `GET /api/notifications` will stay empty in
practice.

The frontend's popup system doesn't depend on that table: `Send.jsx` and
`Security.jsx` call `showToast(...)` directly off the result of the action
the user just took. `NotificationContext` still polls `GET /api/notifications`
every 20s for the `/notifications` history page and the unread badge, and
will start showing real data the moment something inserts rows there (for
example, if you wire `createNotification` into the transfer/PIN flows
later).

## Other mismatches found and fixed in the frontend (adapted, not invented)

- `GET /api/v1/users/me` returns `isActive` (camelCase, no `is_active`) and
  no `created_at` or `phoneNumber` - Profile.jsx was reading fields that
  don't exist; fixed to use what's actually returned.
- The ledger response shape is `{ date, transaction, description, debit,
  credit, balance, currency }`, not `{ entry_type, created_at, amount }` -
  `Transaction.jsx` was built against the wrong shape; fixed.
- `POST /api/v1/auth/register` requires `phoneNumber`, but the registration
  form never collected it - added the field.
- Access tokens are short-lived (15 min) HttpOnly cookies with a working
  `POST /api/v1/auth/refresh`, but nothing called it - `services/api.js` now
  retries once through a silent refresh on a 401 before giving up and
  signing the user out.
- `GET /api/ledger` (JSON) supports `page`/`limit` only; `GET /api/ledger/pdf`
  supports `fromDate`/`toDate` only, not pagination. Statement.jsx reflects
  this honestly: date filters scope the PDF download, pagination controls
  scope the on-screen table - they are not the same filter.
- Transfers do not require a UPI PIN on this backend
  (`transaction.service.js` never calls `verifyUpiPin`), so Send.jsx doesn't
  ask for one. If you want PIN-gated transfers, that's a backend change
  (call `verifyUpiPin` inside `transferMoney`), not a frontend one.
- `POST /api/v1/users/recipient` (look up a wallet ID by phone number)
  existed but was never called anywhere in the frontend - Send.jsx now uses
  it as an optional "find by phone number" helper before confirming a
  transfer.
