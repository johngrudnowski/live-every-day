# Circle Invite Flow

## Goal

Circle invitations let a patient invite a specific person into their support circle. The invite link does not create the relationship by itself; it lets an authenticated user claim the existing `circle_support_people` connection.

## Data Model

- `circle_support_people`
  - Owned by the patient through `user_id`.
  - Represents the relationship slot: display name, role, invite status, optional `linked_user_id`.
  - `linked_user_id` is set after the invited person signs in and accepts.

- `circle_support_invitations`
  - One row per generated invite link.
  - Stores `token_hash`, never the raw token.
  - Tracks delivery method, recipient, expiration, acceptance, revocation, and last sent time.
  - Cascades when the support person or inviter user is deleted.

- `circle_support_person_permission_grants`
  - Grants permissions to the support connection, not to an email address or raw invite.
  - Once the invite is accepted, the linked account inherits what that connection can see.

- `circle_support_messages`
  - Messages from an accepted support person back to the patient.
  - Anchored to `support_person_id`, so the message remains tied to the relationship even if user details change later.

## API Flow

1. Patient creates a support invite.
   - `POST /api/me/circle/support-people`
   - Creates `circle_support_people` with `invite_status = pending`.
   - Creates permission grants if `permissionKeys` are provided.
   - Creates an invitation row and returns a one-time raw invite URL.
   - Invite URLs use `CIRCLE_INVITE_BASE_URL`, falling back to `APP_PUBLIC_URL`, `WEB_URL`, then local development.

2. Patient regenerates or resends an invite.
   - `POST /api/me/circle/support-people/:supportPersonId/invitations`
   - Requires the support person to belong to the current patient.
   - Revokes previous unaccepted invitation rows for that support person.
   - Returns a new raw invite URL.

3. Invitee opens the invite link.
   - `GET /api/circle/invitations/:token`
   - Public preview endpoint.
   - Returns inviter display name, invited display name, expiration, and status.

4. Invitee creates an account or signs in.
   - Auth happens through the normal auth flow.
   - The client keeps the invite token and calls accept after auth succeeds.

5. Invitee accepts.
   - `POST /api/circle/invitations/:token/accept`
   - Requires auth.
   - Rejects expired, revoked, accepted, self-owned, or already-claimed invites.
   - Sets `circle_support_people.linked_user_id` to the current user.
   - Sets `invite_status = active` and `accepted_at`.
   - Sets invitation `accepted_at`.

6. Supporter sends a message.
   - `POST /api/circle/support-people/:supportPersonId/messages`
   - Requires auth.
   - Current user must match `circle_support_people.linked_user_id`.
   - Creates `circle_support_messages` and updates `last_message_at`.

7. Patient reads messages.
   - `GET /api/me/circle/support-messages`
   - Requires auth.
   - Returns messages for the current patient.

## Security Notes

- Raw invite tokens are only returned when generated. The database stores SHA-256 hashes.
- Invitation acceptance requires an authenticated account.
- Permissions are checked by `support_person_id`, not by token, email, or phone.
- Deleting the patient user cascades support people, invitations, permission grants, and messages.
- If a linked supporter deletes their account, `linked_user_id` and message `author_user_id` are set to null where appropriate, preserving the patient's relationship history.

## Future UI Work

- Add invite creation UI under My Circle.
- Add web/mobile invite landing screen for preview, sign-in/sign-up, and accept.
- Add supporter message composer.
- Add patient-facing message inbox or pre-check-in message surface.
