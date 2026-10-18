-- Kept · DESTRUCTIVE RESET
--
-- Deletes every synced state row in this project. Run it only when you
-- intend to wipe all cloud copies. Local data on devices is not touched.
--
-- Dashboard → SQL Editor → New query → paste → Run.

delete from public.kept_state;

-- Optional: remove the sign-in account too. Deleting the auth user
-- cascades to kept_state. Uncomment and replace the email.
--
-- delete from auth.users where email = 'you@example.com';

-- Verify the wipe.
select count(*) as remaining_rows from public.kept_state;
