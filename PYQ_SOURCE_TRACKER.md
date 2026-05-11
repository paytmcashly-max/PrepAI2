# PYQ Source Tracker

Use this tracker before importing any verified previous-year question.

Last updated: 2026-05-11

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
- `in_review`: questions are collected or linked, but official confirmation is incomplete.
- `ready_to_import`: verified against source and ready for admin import.
- `imported`: imported with `source_reference`.
- `rejected`: source is memory-based, unofficial, or mismatched.

## Bihar SI Source Search Log

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | 2025-2026 | BPSSC Police Sub-Inspector notices, Advt. No. 05/2025 | https://bpssc.bihar.gov.in/ | N/A | source_found | 0 | Official BPSSC site found for exam/admit-card/result metadata. No official question-paper PDF was found during this pass, so this is not importable as PYQ content. |
| Bihar SI | 2023 | Prelims, 17 Dec 2023, Shift 1 | https://testbook.com/pdf-viewer?id=65afa031c668b36a25021a33&language=english | Full paper candidate PDF, not topic-extracted | in_review | 0 | Third-party Testbook PDF viewer. Do not import as `verified_pyq` unless matched with an official/question-paper source reference. |
| Bihar SI | 2023 | Prelims, 17 Dec 2023, Shift 2 | https://testbook.com/pdf-viewer?id=65afa05ca3039b040bf7f577&language=english | Full paper candidate PDF, not topic-extracted | in_review | 0 | Third-party Testbook PDF viewer. Do not import as `verified_pyq` unless matched with an official/question-paper source reference. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Full paper candidate PDF, not topic-extracted | in_review | 0 | Third-party Testbook PDF viewer. Do not import as `verified_pyq` unless matched with an official/question-paper source reference. |
| Bihar SI | 2023 | Prelims, 17 Dec 2023, memory-based questions | https://www.collegedekho.com/news/bpssc-bihar-si-question-paper-2023-available-check-question-paper-analysis-48196/ | Memory-based Shift 1/Shift 2 lists | rejected | 0 | Page labels the content as memory-based/unofficial. Do not import as verified. |

## Bihar SI

### Maths

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Percentage | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Ratio & Proportion | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Profit & Loss | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |

### Reasoning

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Analogy | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Series | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |

### GK/GS

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | 2023 | Prelims, 17 Dec 2023, Shift 1/2 | https://testbook.com/pdf-viewer?id=65afa031c668b36a25021a33&language=english ; https://testbook.com/pdf-viewer?id=65afa05ca3039b040bf7f577&language=english | Modern History | in_review | 0 | Candidate PDFs found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2023 | Prelims, 17 Dec 2023, Shift 1/2 | https://testbook.com/pdf-viewer?id=65afa031c668b36a25021a33&language=english ; https://testbook.com/pdf-viewer?id=65afa05ca3039b040bf7f577&language=english | Polity | in_review | 0 | Candidate PDFs found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2023 | Prelims, 17 Dec 2023, Shift 1/2 | https://testbook.com/pdf-viewer?id=65afa031c668b36a25021a33&language=english ; https://testbook.com/pdf-viewer?id=65afa05ca3039b040bf7f577&language=english | Bihar GK | in_review | 0 | Candidate PDFs found, but not official-confirmed and not topic-extracted yet. |

### Hindi

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | विलोम | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | पर्यायवाची | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | मुहावरे | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |

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
