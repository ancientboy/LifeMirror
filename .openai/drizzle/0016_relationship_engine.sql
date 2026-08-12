-- PHASE-020: normalized private relationship people, cases, immutable events,
-- reality feedback and ephemeral attachment metadata.
CREATE TABLE IF NOT EXISTS relationship_people (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 40),
  relationship_label TEXT NOT NULL DEFAULT '',
  domain TEXT NOT NULL CHECK (domain IN ('romance','friendship','work','family','other')),
  role TEXT NOT NULL CHECK (role IN ('dating','partner','ex','friend','colleague','manager','report','client','parent','child','sibling','relative','other')),
  stage TEXT NOT NULL DEFAULT 'unknown' CHECK (stage IN ('unknown','new','developing','stable','conflict','cooling','separated','repairing')),
  power_position TEXT NOT NULL DEFAULT 'unknown' CHECK (power_position IN ('roughly_equal','user_lower_power','user_higher_power','dependent','unknown')),
  classification_source TEXT NOT NULL DEFAULT 'inferred' CHECK (classification_source IN ('inferred','user_confirmed','legacy_migration')),
  confirmed_by_user INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_by_user IN (0,1)),
  legacy_person_id TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner_user_id, legacy_person_id)
);
CREATE INDEX IF NOT EXISTS relationship_people_owner_recent_idx ON relationship_people(owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS relationship_cases (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES relationship_people(id) ON DELETE SET NULL,
  goal TEXT NOT NULL CHECK (goal IN ('interpret_signal','draft_reply','decide_initiation','repair','set_boundary','refuse','prepare_conversation','other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','awaiting_reply','resolved','archived')),
  source TEXT NOT NULL CHECK (source IN ('text','screenshot','person_mirror','followup')),
  initial_text_redacted TEXT,
  strategy_key TEXT NOT NULL,
  recommended_reply TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS relationship_cases_owner_recent_idx ON relationship_cases(owner_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS relationship_cases_person_recent_idx ON relationship_cases(person_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS relationship_events (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES relationship_people(id) ON DELETE SET NULL,
  case_id TEXT NOT NULL REFERENCES relationship_cases(id) ON DELETE CASCADE,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('user_message','extracted_message','classification_confirmed','analysis_created','reply_copied','planned_action','actual_reply','reality_feedback','person_correction','case_resolved')),
  payload_json TEXT NOT NULL,
  provenance TEXT NOT NULL CHECK (provenance IN ('user_authored','model_extracted','model_generated','system_migration')),
  created_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS relationship_events_case_time_idx ON relationship_events(case_id, created_at);
CREATE INDEX IF NOT EXISTS relationship_events_person_time_idx ON relationship_events(person_id, created_at DESC);

CREATE TABLE IF NOT EXISTS relationship_feedback (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES relationship_people(id) ON DELETE SET NULL,
  case_id TEXT NOT NULL REFERENCES relationship_cases(id) ON DELETE CASCADE,
  acted INTEGER NOT NULL CHECK (acted IN (0,1)),
  outcome TEXT NOT NULL CHECK (outcome IN ('positive','mixed','negative','no_response','not_yet')),
  actual_reply_summary TEXT,
  suggestion_helpful INTEGER CHECK (suggestion_helpful IN (0,1)),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS relationship_feedback_person_time_idx ON relationship_feedback(person_id, created_at DESC);

CREATE TABLE IF NOT EXISTS attachment_metadata (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES identity_users(id) ON DELETE CASCADE,
  case_id TEXT REFERENCES relationship_cases(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 1258291),
  width INTEGER,
  height INTEGER,
  content_hash TEXT NOT NULL,
  parse_status TEXT NOT NULL CHECK (parse_status IN ('received','parsed','failed','deleted')),
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS relationship_revisions (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person','case','event')),
  entity_id TEXT NOT NULL,
  revision_kind TEXT NOT NULL CHECK (revision_kind IN ('created','classified','corrected','merged','deleted','migrated')),
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS relationship_revisions_entity_idx ON relationship_revisions(owner_user_id, entity_type, entity_id, created_at DESC);

CREATE TABLE product_metric_events_v4 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'chat_message_sent','daily_opened','daily_checkin_completed','mirror_result_ready',
    'tool_continued_chat','share_card_shared','share_link_created','share_response_created',
    'first_reply_received','conversation_continued','life_loop_created','life_loop_feedback',
    'memory_recall_positive','memory_recall_negative','share_intent','invite_accepted',
    'onboarding_started','onboarding_prompt_used','generation_stopped','generation_retried',
    'chat_feedback_helpful','chat_feedback_missed','account_bound',
    'relationship_entry_opened','relationship_text_submitted','relationship_image_submitted',
    'relationship_clarification_shown','relationship_clarification_answered','relationship_answer_received',
    'relationship_reply_copied','relationship_person_saved','relationship_case_revisited',
    'relationship_feedback_submitted','relationship_outcome_positive','relationship_outcome_negative','vision_parse_failed'
  )),
  surface TEXT NOT NULL CHECK (surface IN ('chat','daily','mirror','share','relationship','onboarding','account')),
  event_key TEXT NOT NULL CHECK (length(event_key) BETWEEN 8 AND 120),
  occurred_at TEXT NOT NULL,
  UNIQUE (user_id, event_type, event_key)
);
INSERT INTO product_metric_events_v4 SELECT * FROM product_metric_events;
DROP TABLE product_metric_events;
ALTER TABLE product_metric_events_v4 RENAME TO product_metric_events;
CREATE INDEX product_metric_events_user_recent_idx ON product_metric_events(user_id, occurred_at DESC);
CREATE INDEX product_metric_events_type_recent_idx ON product_metric_events(event_type, occurred_at DESC);

