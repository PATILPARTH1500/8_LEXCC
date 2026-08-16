# Duplicate migration version reconciliation

## Current conflict

The repository contains two historical migrations with version `20260714000012`:

- `20260714000012_admin_product_variants_rls.sql`
- `20260714000012_order_notifications.sql`

Repository history alone cannot prove which file, if either, was recorded in the live
`supabase_migrations.schema_migrations` table. Renaming or deleting either file without
checking the linked project could make local and production migration history diverge.

## Required live procedure

1. Link the Supabase CLI to the production project using an authorized account.
2. Run `supabase migration list` and record which `20260714000012` migration was applied.
3. Compare the live schema for the `order_notifications` table and the three admin
   `product_variants` policies with the SQL in both files.
4. Reconcile the history using the Supabase CLI's supported migration-repair command for
   the installed CLI version. Discover the exact syntax with `supabase migration repair --help`.
5. Give the unapplied migration a new unique version only after the live history is known,
   then run a dry-run/database diff before deployment.

Do not rename, delete, or mark either migration applied based only on this checkout.

**REQUIRES LIVE SUPABASE VERIFICATION**
