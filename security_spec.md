# Security Specification & Test Suite

## 1. Data Invariants

1. **Identity & Ownership**: A user cannot write or modify resources with an `authorId` different from their own `request.auth.uid`.
2. **Self-Escalation Barrier**: Non-admin users cannot change their own `role` or `status` in `/users/{userId}`. Normal users creating a profile must initialize with `role == 'member'` and `status == 'active'`.
3. **Admin Exclusivity**: Bootstrapped admin email (`s6710380123@pkru.ac.th`) or verified records in `/admins/{adminUid}` have full authority over moderation logs, report resolution, site settings, and user status toggling.
4. **Favorite Ownership**: A user can only create/delete favorites where `userId == request.auth.uid` and path is `{userId}_{resourceId}`.
5. **Content Visibility**: Guests and members can read only `published` resources unless the viewer is the author or an admin.
6. **Report Integrity**: Any authenticated member can report a resource, but only admins/moderators can update report status or delete reports.
7. **Audit Immutability**: Moderation logs cannot be edited or deleted by any user once written.

---

## 2. The "Dirty Dozen" Payloads (Malicious / Invalid Payloads)

1. **Payload 1 (Self-Assigned Admin)**: User creates `/users/evilUid` with `"role": "admin"`. (Violation: Privilege escalation)
2. **Payload 2 (Resource Author Spoofing)**: Attacker with UID `evilUser` creates `/resources/res123` with `"authorId": "teacherUid"`. (Violation: Identity spoofing)
3. **Payload 3 (Overwriting Someone Else's Resource)**: User B attempts `update` on `/resources/resOwnedByUserA` without admin rights. (Violation: Authorization bypass)
4. **Payload 4 (Ghost Fields / Shadow Update)**: Updating a resource with an unapproved key `"isFeaturedByGod": true`. (Violation: Strict key schema)
5. **Payload 5 (Unbounded Resource Description)**: Creating a resource with a 2MB description string. (Violation: Denial of wallet / size limit)
6. **Payload 6 (Forged Favorite)**: User A creates `/favorites/userB_res1` with `"userId": "userB"`. (Violation: Impersonation)
7. **Payload 7 (Unauthenticated Resource Creation)**: Unauthenticated request to `create` in `/resources`. (Violation: Missing authentication)
8. **Payload 8 (Non-Admin Resolving Reports)**: Regular user updates `/reports/rep1` setting `"status": "dismissed"`. (Violation: Moderation privilege violation)
9. **Payload 9 (Non-Admin Altering Global Site Settings)**: Regular user modifies `/settings/general`. (Violation: Admin exclusivity)
10. **Payload 10 (Direct Deletion of Audit Logs)**: Any user attempts `delete` on `/moderationLogs/log1`. (Violation: Audit immutability)
11. **Payload 11 (Invalid ID Injection)**: Attempt to read or write a document with an ID containing malicious path traversal `../../bad`. (Violation: Path variable hardening)
12. **Payload 12 (Tampering with Favorite Doc)**: Regular member tries to modify an existing favorite document rather than create/delete. (Violation: Immobility of favorites)

---

## 3. Test Runner Design (`firestore.rules.test.ts`)

```typescript
// Test suite outline ensuring all Dirty Dozen payloads return PERMISSION_DENIED
// when run against the Local Firebase Emulator / Security Rules Validator.
```
