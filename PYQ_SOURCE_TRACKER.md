# PYQ Source Tracker

Use this tracker before importing any verified previous-year question.

## Verification Rules

- Only official/question-paper sources can become `verified_pyq`.
- Every `verified_pyq` must include a `source_reference`.
- `source_reference` should be specific enough to re-check the question later: official paper name, exam year/date, paper/shift/set, question number or range, page number when available, and source URL or local file path.
- Coaching-site, memory-based, reconstructed, or social-media sources must be reviewed and kept unverified unless they are officially confirmed.
- AI/demo/practice questions must use `source = ai_generated` and `is_verified = false`.
- Do not insert verified PYQs unless the source reference is available.
- Keep the existing 11 Bihar SI `ai_generated` samples as unverified practice only.

## Status Legend

- `not_started`: source has not been collected.
- `source_found`: source exists but questions are not extracted.
- `in_review`: questions are collected and being checked.
- `ready_to_import`: verified against source and ready for admin import.
- `imported`: imported with `source_reference`.
- `rejected`: source is memory-based, unofficial, or mismatched.

## Bihar SI

### Maths

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | TBD | TBD | TBD | Percentage | not_started | 0 | Need official paper/source before verified import. |
| Bihar SI | TBD | TBD | TBD | Ratio & Proportion | not_started | 0 | Need official paper/source before verified import. |
| Bihar SI | TBD | TBD | TBD | Profit & Loss | not_started | 0 | Need official paper/source before verified import. |

### Reasoning

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | TBD | TBD | TBD | Analogy | not_started | 0 | Need official paper/source before verified import. |
| Bihar SI | TBD | TBD | TBD | Series | not_started | 0 | Need official paper/source before verified import. |

### GK/GS

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | TBD | TBD | TBD | Modern History | not_started | 0 | Need official paper/source before verified import. |
| Bihar SI | TBD | TBD | TBD | Polity | not_started | 0 | Need official paper/source before verified import. |
| Bihar SI | TBD | TBD | TBD | Bihar GK | not_started | 0 | Need official paper/source before verified import. |

### Hindi

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | TBD | TBD | TBD | विलोम | not_started | 0 | Need official paper/source before verified import. |
| Bihar SI | TBD | TBD | TBD | पर्यायवाची | not_started | 0 | Need official paper/source before verified import. |
| Bihar SI | TBD | TBD | TBD | मुहावरे | not_started | 0 | Need official paper/source before verified import. |

## Import Checklist

Before importing a row as `verified_pyq`:

1. Confirm the source is official or an exact question-paper file.
2. Confirm exam, year, paper/shift/set, subject, chapter, question, options, answer, and explanation if available.
3. Write a complete `source_reference`.
4. Mark tracker status as `ready_to_import`.
5. Import through the admin PYQ form.
6. Confirm the PYQ page shows the verified badge, source reference, and correct filters.
7. Update `imported count` and status to `imported`.

If the source cannot be officially confirmed, keep it out of `verified_pyq`. If it is useful as practice, add it only as `ai_generated`/unverified content after review.
