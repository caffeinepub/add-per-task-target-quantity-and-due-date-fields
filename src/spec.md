# Specification

## Summary
**Goal:** Restore the ability to create/save idea notes by fixing admin-token authorization and adding a clear frontend guard for anonymous non-admin users.

**Planned changes:**
- Backend: adjust authorization checks so recognized admins can perform note operations (create/update/delete/view/list, checklist toggle, add image, and category/progress filters) without requiring the `#user` permission, while keeping existing Unauthorized behavior for non-admin/non-user callers and preserving non-admin “own notes only” rules.
- Frontend: initialize access control with `_initializeAccessControlWithSecret` using the `#caffeineAdminToken=...` URL parameter even when the session is anonymous (not logged in with Internet Identity).
- Frontend: block Save for anonymous non-admin users (no Internet Identity login and no `caffeineAdminToken`) and show an English toast/error indicating login is required, instead of calling the backend and failing.

**User-visible outcome:** Admin-token sessions (via `#caffeineAdminToken`) can save notes without Internet Identity login, and anonymous non-admin users see a clear “login required” message when attempting to save.
