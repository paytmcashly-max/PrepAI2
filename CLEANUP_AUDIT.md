# Cleanup Audit - Unsupported Exam Removal

Generated: 2026-05-11T14:19:29.752Z

Supported exam IDs: `bihar_si`, `up_police`, `ssc_gd`.

## Summary Counts

- Exams total: 7
- Supported exams count: 3
- Unsupported exams count: 4
- Subjects total: 9
- Original practice attempts count: 40
- User PYQ attempts count: 1
- Weak generic original questions count: 520

## Exams By ID

| id | name | supported |
| --- | --- | --- |
| `bihar-si` | Bihar Police SI | no |
| `up-police` | UP Police | no |
| `ssc-gd` | SSC GD | no |
| `ssc-cgl` | SSC CGL | no |
| `bihar_si` | Bihar Police SI | yes |
| `up_police` | UP Police | yes |
| `ssc_gd` | SSC GD Constable | yes |

## Chapters By Exam

| exam_id | count |
| --- | ---: |
| `bihar_si` | 58 |
| `bihar-si` | 12 |
| `ssc_gd` | 52 |
| `ssc-cgl` | 12 |
| `ssc-gd` | 10 |
| `up_police` | 47 |
| `up-police` | 10 |

## Exam Subjects By Exam

| exam_id | count |
| --- | ---: |
| `bihar_si` | 5 |
| `ssc_gd` | 6 |
| `up_police` | 5 |

## User Study Plans By Exam And Status

| exam_id | status | count |
| --- | --- | ---: |
| `bihar_si` | active | 2 |
| `bihar_si` | archived | 13 |
| `ssc_gd` | archived | 1 |
| `up_police` | archived | 1 |

## User Daily Tasks By Exam And Status

| exam_id | status | count |
| --- | --- | ---: |
| `bihar_si` | completed | 21 |
| `bihar_si` | pending | 979 |

## Study Resources By Exam, Active State, And Type

| exam_id | is_active | resource_type | count |
| --- | --- | --- | ---: |
| `bihar_si` | true | concept_note | 23 |
| `bihar_si` | true | current_affairs | 1 |
| `bihar_si` | true | physical_training | 6 |
| `ssc_gd` | true | concept_note | 18 |
| `ssc_gd` | true | current_affairs | 1 |
| `ssc_gd` | true | physical_training | 5 |
| `up_police` | true | concept_note | 19 |
| `up_police` | true | current_affairs | 1 |
| `up_police` | true | physical_training | 5 |

## Original Practice By Exam, Active State, Category, And Source

| exam_id | is_active | practice_category | source_type | count |
| --- | --- | --- | --- | ---: |
| `bihar_si` | true | concept_practice | prepai_original | 290 |
| `bihar_si` | true | study_method | prepai_original | 10 |
| `ssc_gd` | true | concept_practice | prepai_original | 220 |
| `ssc_gd` | true | study_method | prepai_original | 10 |
| `up_police` | true | concept_practice | prepai_original | 230 |
| `up_police` | true | study_method | prepai_original | 10 |

## PYQ By Exam, Source, Status, And Verification

| exam_id | source | verification_status | is_verified | count |
| --- | --- | --- | --- | ---: |
| `bihar_si` | ai_generated | ai_practice | false | 11 |
| `bihar_si` | trusted_third_party | in_review | false | 4 |
| `bihar_si` | trusted_third_party | third_party_reviewed | false | 1 |

## Mock And Rule Tables

| table | grouping | count |
| --- | --- | ---: |
| mock_tests | none | 0 |
| mock_test_questions | column `exam_id` missing | 0 |
| task_templates | `bihar_si` | 18 |
| task_templates | `bihar-si` | 5 |
| task_templates | `ssc_gd` | 20 |
| task_templates | `ssc-cgl` | 5 |
| task_templates | `ssc-gd` | 6 |
| task_templates | `up_police` | 18 |
| task_templates | `up-police` | 5 |
| planner_rules | column `exam_id` missing | 0 |
| revision_rules | `bihar_si` | 3 |
| revision_rules | `bihar-si` | 1 |
| revision_rules | `ssc_gd` | 3 |
| revision_rules | `ssc-cgl` | 1 |
| revision_rules | `ssc-gd` | 1 |
| revision_rules | `up_police` | 3 |
| revision_rules | `up-police` | 1 |
| mock_rules | `bihar_si` | 2 |
| mock_rules | `bihar-si` | 1 |
| mock_rules | `ssc_gd` | 2 |
| mock_rules | `ssc-cgl` | 1 |
| mock_rules | `ssc-gd` | 1 |
| mock_rules | `up_police` | 2 |
| mock_rules | `up-police` | 1 |
| physical_rules | `bihar_si` | 3 |
| physical_rules | `bihar-si` | 3 |
| physical_rules | `ssc_gd` | 3 |
| physical_rules | `ssc-gd` | 3 |
| physical_rules | `up_police` | 3 |
| physical_rules | `up-police` | 3 |
| resource_generation_jobs | table missing | 0 |
| official_pyq_sources | table missing | 0 |
| exam_content_packs | table missing | 0 |

## Weak Generic Original Question Match

- Match rules: question contains `sabse pehle kya identify`, question contains `exam question solve karte waqt`, answer equals `Topic rule/pattern`, or options equal the generic rule/pattern set.
- Before cleanup count: 520

## Safety Notes

- This audit is recorded before destructive unsupported exam cleanup.
- Auth users are not counted for deletion and must not be deleted.
- Profiles must be preserved; unsupported profile exam targets should only be cleared if needed.
