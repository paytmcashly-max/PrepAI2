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

## Source Taxonomy Decision Guide

| source | when to use | verification status | import rule |
|---|---|---|---|
| `verified_pyq` | Official question paper, official answer key, or exact official response sheet with question text and answer reference. | `official_verified` | Can be imported only with `is_verified = true`, chapter, answer, and complete `source_reference`. |
| `trusted_third_party` | Exact candidate PDF or reputable third-party paper collection that has been manually reviewed but is not official. | `in_review` or `third_party_reviewed` | Can be imported as practice only with `is_verified = false`, `source_name`, and `source_reference`. Never call official. |
| `memory_based` | Memory-based article/list, reconstructed paper, or candidate recall. | `memory_based` | Can be imported only as unofficial practice with `is_verified = false` and a clear source reference, or kept rejected in this tracker. |
| `ai_generated` | AI/demo/practice questions. | `ai_practice` | Can be imported as practice only with `is_verified = false`; source reference is optional. |

Rejected sources stay only in this tracker and must not be inserted into `pyq_questions`.

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
| Bihar SI | 2023-2026 | Official BPSSC site scan for question paper / answer key / OMR objection files | https://bpssc.bihar.gov.in/Default.htm ; https://bpssc.bihar.gov.in/Notices.htm ; https://bpssc.bihar.gov.in/Syllabus.htm | No question range found | rejected | 0 | Official-site scan found Police Sub-Inspector notices, centre lists, result/marks notices, and admit-card links, but no public official question-paper PDF or answer-key file. Do not import verified PYQs from this row. |
| Bihar SI | 2023 | BPSSC Advt. No. 02/2023 result/marks notices | https://bpssc.bihar.gov.in/Notices/NB-2024-08-19-01.pdf ; https://bpssc.bihar.gov.in/Notices/NB-2024-07-09-01.pdf | N/A | source_found | 0 | Official BPSSC metadata source for the 2023 recruitment/result timeline only. It does not contain question text or answer keys, so it is not a PYQ import source. |
| Bihar SI | 2023 | Prelims, 17 Dec 2023, Shift 1 | https://testbook.com/pdf-viewer?id=65afa031c668b36a25021a33&language=english | Full paper candidate PDF, not topic-extracted | in_review | 0 | Third-party Testbook PDF viewer. Do not import as `verified_pyq` unless matched with an official/question-paper source reference. |
| Bihar SI | 2023 | Prelims, 17 Dec 2023, Shift 2 | https://testbook.com/pdf-viewer?id=65afa05ca3039b040bf7f577&language=english | Full paper candidate PDF, not topic-extracted | in_review | 0 | Third-party Testbook PDF viewer. Do not import as `verified_pyq` unless matched with an official/question-paper source reference. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Q5, Q16, Q22, Q38, Q73 extracted from Testbook English PDF | in_review | 5 | Third-party Testbook PDF viewer and candidate PDF. Imported only as `trusted_third_party`, `is_verified = false`; Q5 has been admin-reviewed as `third_party_reviewed`, and the remaining 4 rows stay `in_review`. Do not import as `verified_pyq` unless matched with an official/question-paper source reference. |
| Bihar SI | 2023 | Prelims, 17 Dec 2023, memory-based questions | https://www.collegedekho.com/news/bpssc-bihar-si-question-paper-2023-available-check-question-paper-analysis-48196/ | Memory-based Shift 1/Shift 2 lists | rejected | 0 | Page labels the content as memory-based/unofficial. Do not import as verified. |

## Bihar SI

### Maths

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Q38 Percentage Error | in_review | 1 | Imported only as unverified `trusted_third_party` practice with Testbook source reference. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Q22 Ratio & Proportion | in_review | 1 | Imported only as unverified `trusted_third_party` practice with Testbook source reference. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Q16 Discount / Profit & Loss | in_review | 1 | Imported only as unverified `trusted_third_party` practice with Testbook source reference. |

### Reasoning

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Analogy | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Series | in_review | 0 | Candidate PDF found, but not official-confirmed and not topic-extracted yet. |
| Bihar SI | 2022 | Mains, 24 Apr 2022, Shift 1 | https://testbook.com/pdf-viewer?id=6319c442455d78219845128e&language=english | Q5 and Q73 Coding-Decoding | in_review | 2 | Imported only as unverified `trusted_third_party` practice with Testbook source reference. Q5 is `third_party_reviewed`; Q73 remains `in_review`. |

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

## UP Police Source Search Log

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| UP Police | 2026 | SI Civil Police and equivalent posts, written exam held 14-15 Mar 2026, final answer key notice | https://uppbpb.gov.in/FilesUploaded/Notice/UPSI%20ANS%20KEY%2007%20May%20202605b0d6e3-5102-463c-aedf-1a6997d3f991.pdf | Answer-key notice only; no durable question text extracted | source_found | 0 | Official UPPRPB notice. Useful as answer-key/source metadata, but not enough to import verified PYQs without the exact question paper/series text. |
| UP Police | 2026 | SI Civil Police and equivalent posts, final answer key/result candidate link | https://www.siupexam25.com/si2025writtentestresults/loginpage.aspx | Candidate-login response/answer-key access | source_found | 0 | Officially linked from UPPRPB home page. Candidate-login/time-bound style source; do not import unless a complete question paper and source reference are captured. |
| UP Police | 2025 | Head Constable Motor Transport departmental exam, written exam held 05 Oct 2025 | https://uppbpb.gov.in/FilesUploaded/Notice/VIG1_06112025e39dbc78-901e-426c-a525-9fbe93320358.pdf | Revised/deleted answer-option details by series | source_found | 0 | Official UPPRPB correction notice with answer-option changes, but for a departmental Head Constable Motor Transport exam, not the main UP Police user target. Do not import into UP Police PYQ bank unless mapped to a dedicated exam. |
| UP Police | 2024 | Constable Civil Police, 23/24/25/30/31 Aug 2024 shifts | https://www.sscadda.com/up-police-constable-question-paper-2024/ | Third-party shift-wise paper links | in_review | 0 | Third-party candidate PDFs. Keep for manual comparison only; cannot become `verified_pyq` unless matched against official UPPRPB paper/answer-key source. |
| UP Police | 2024 | Constable Civil Police, unofficial/solved paper collections | https://thinkgovtjobs.com/up-police-constable-question-paper-2024/ | Third-party paper/answer-key list | in_review | 0 | Third-party source. Do not import as verified without official confirmation. |
| UP Police | 2024 | Constable Civil Police, memory/unofficial answer-key articles | https://examstable.com/2024/up-police-constable-answer-key-2024-pdf-download/ | Article-only answer-key summary | rejected | 0 | Article states candidates view their own paper/answer key; no official public question text. Do not import as verified. |

## SSC GD Source Search Log

| exam | year | paper/shift/set | source URL or file location | question range collected | verification status | imported count | notes |
|---|---:|---|---|---|---|---:|---|
| SSC GD | 2024 | Constable GD CBE held 20 Feb-07 Mar and 30 Mar 2024 | https://ssc.gov.in/api/attachment/uploads/masterData/Results/CT%28GD%29%202024%20_CBE%20_Result%20Write%20Up_10.07.2024.pdf | Result write-up, final answer key / question paper / response sheet availability notice | source_found | 0 | Official SSC result write-up says final answer keys with question papers/response sheets were available from 10.07.2024 to 24.07.2024 via login. It does not include public question text, so do not import. |
| SSC GD | 2022 | Constable GD in CAPFs, SSF, Rifleman GD, Sepoy in NCB | https://doc.ssc.nic.in/Portal/AnswerKey | Answer-key portal listing | source_found | 0 | Official SSC answer-key portal lists tentative/final answer-key notices and question-paper availability. Use only as metadata unless a durable question paper/response sheet is captured. |
| SSC GD | 2021 | Constable GD Paper-I final answer keys with question papers | https://ssc.nic.in/SSCFileServer/PortalManagement/UploadedFiles/final_answerkey21_28032022.pdf | Official notice only; candidate-specific question papers were time-limited | source_found | 0 | Official SSC notice says final answer keys along with question papers were uploaded and available from 28.03.2022 to 26.04.2022. Link is metadata only now; no question import. |
| SSC GD | 2018 | Constable GD final answer keys | https://ssc.nic.in/SSCFileServer/PortalManagement/UploadedFiles/answer_key_gd_10072019.pdf | Official notice only; final keys were time-limited | source_found | 0 | Official SSC notice says final answer keys were uploaded from 10.07.2019 to 09.08.2019. No durable question text available in the notice. |
| SSC GD | 2021-2024 | Third-party SSC GD previous-year paper collections | https://testbook.com/previous-year-papers | Candidate PDF collections | in_review | 0 | Third-party collection. Use only for manual comparison; cannot become `verified_pyq` unless matched with official SSC source reference. |

## Import Checklist

Before importing a row as `verified_pyq`:

1. Confirm the source is official or an exact question-paper file.
2. Confirm exam, year, paper/shift/set, subject, chapter, question, options, answer, and explanation if available.
3. Write a complete `source_reference`.
4. Mark tracker status as `ready_to_import`.
5. Import through the admin PYQ form.
6. Confirm the PYQ page shows the verified badge, source reference, and correct filters.
7. Update `imported count` and status to `imported`.

If the source cannot be officially confirmed, keep it out of `verified_pyq`. If it is useful as practice, add it only as `trusted_third_party`, `memory_based`, or `ai_generated` unverified content after review, based on the source taxonomy above.
