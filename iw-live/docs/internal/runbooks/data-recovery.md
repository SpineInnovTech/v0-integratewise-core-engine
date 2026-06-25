# Data Recovery Runbook

Use this runbook when production data is missing, corrupted, or written incorrectly and you need a controlled recovery plan.

## Typical Triggers

- destructive or incorrect migration
- bad normalization or mapping logic
- accidental overwrite of tenant-scoped records
- failed release that wrote inconsistent state
- operator error during replay, redrive, or backfill

## First Response

1. Stop new writes that could worsen the damage.
2. Define the affected data surface:
   - Spine
   - knowledge records
   - tenant config
   - billing or audit records
3. Record timeframe, affected tenants, and suspected change.

## Preserve Evidence

- capture row counts and sample broken records
- record release version, migration IDs, and timestamps
- preserve failing payloads or replay inputs
- confirm whether a backup, snapshot, or PITR window exists

## Recovery Strategy Decision

Choose the least risky option:

| Strategy               | Use when                                                           |
| ---------------------- | ------------------------------------------------------------------ |
| Forward fix            | Logic bug can be corrected and data can be repaired in place       |
| Controlled replay      | Source events or sync inputs still exist and writes are idempotent |
| Restore and compare    | Blast radius is large or direct repair is unsafe                   |
| Point-in-time recovery | Database state must be rewound before corruption spread            |

## Safe Recovery Flow

1. Restore to an isolated environment first when possible.
2. Compare restored data with current production state.
3. Decide exactly which records or tenants need recovery.
4. Apply repair or replay in small batches.
5. Validate correctness before reopening writes broadly.

## Validation Checklist

- affected tenants are restored
- counts and spot checks match expectations
- application reads succeed on repaired entities
- no duplicate writes or replay loops were introduced
- audit trail documents what was changed

## Escalate Immediately If

- corruption spans many tenants
- billing, auth, or approval records are involved
- the only recovery option is destructive rollback in production

## Related Docs

- [deployment-and-rollback.md](deployment-and-rollback.md)
- [sync-failure-and-dlq-redrive.md](sync-failure-and-dlq-redrive.md)
