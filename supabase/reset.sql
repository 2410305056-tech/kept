-- Kept · DESTRUCTIVE RESET
--
-- Wipes every cloud copy (old per-user rows + shared phone ledger).
-- Local data on phones is NOT touched — clear that in the app or browser.
--
-- Dashboard → SQL Editor → New query → paste → Run.

delete from public.kept_ledger;
delete from public.kept_state;

-- Optional: also delete login accounts from the old sign-in system.
-- delete from auth.users where email = 'you@example.com';

select
  (select count(*) from public.kept_ledger) as ledger_rows,
  (select count(*) from public.kept_state) as old_state_rows;
