export interface Profile {
  id: string; // TEXT PRIMARY KEY
  supabase_auth_user_id?: string; // UUID UNIQUE
  username?: string; // TEXT
  email?: string; // TEXT
  subscription_tier: string; // TEXT DEFAULT 'free' NOT NULL
  subscription_status?: string; // TEXT
  clerk_subscription_id?: string; // TEXT UNIQUE
  storage_quota_bytes?: number; // BIGINT DEFAULT 536870912
  current_theme_id?: string; // UUID
  interface_layout?: string; // TEXT DEFAULT 'default'
  xp_points?: number; // INT DEFAULT 0
  user_level?: number; // INT DEFAULT 1
  current_journal_streak?: number; // INT DEFAULT 0
  longest_journal_streak?: number; // INT DEFAULT 0
  last_entry_date?: string; // TIMESTAMPTZ - Adding this field for streak calculation
  preferences?: Record<string, unknown>; // JSONB
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
}

export interface JournalEntry {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  entry_timestamp: string; // TIMESTAMPTZ NOT NULL
  title?: string; // TEXT
  content?: string; // TEXT
  is_draft?: boolean; // BOOLEAN DEFAULT FALSE
  sentiment_score?: number; // FLOAT
  sentiment_label?: string; // TEXT
  manual_mood_label?: string; // TEXT
  color_code?: string; // TEXT
  ocr_processed_text?: string; // TEXT
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  project_id?: string | null; // UUID NULL
}

export interface MediaAttachment {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  entry_id: string; // UUID NOT NULL
  user_id: string; // TEXT NOT NULL
  file_path: string; // TEXT NOT NULL UNIQUE -- Path in Supabase Storage
  file_url_cached: string; // TEXT NOT NULL UNIQUE
  file_name_original?: string; // TEXT
  file_type: string; // TEXT NOT NULL
  mime_type: string; // TEXT NOT NULL
  file_size_bytes: number; // BIGINT NOT NULL
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
}

export interface Tag {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  name: string; // TEXT NOT NULL
  color_hex?: string; // TEXT
  is_ai_suggested?: boolean; // BOOLEAN DEFAULT FALSE
  icon_name?: string; // TEXT
  icon_emoji?: string; // TEXT
  image_path?: string; // TEXT
  image_url_cached?: string; // TEXT
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  // UNIQUE (user_id, name)
}

export interface EntryTag {
  entry_id: string; // UUID NOT NULL
  tag_id: string; // UUID NOT NULL
  user_id: string; // TEXT NOT NULL
  // PRIMARY KEY (entry_id, tag_id)
}

export interface AiGeneratedMedia {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  entry_id?: string; // UUID
  media_type: string; // TEXT NOT NULL
  file_path: string; // TEXT NOT NULL UNIQUE
  generation_params?: Record<string, unknown>; // JSONB
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
}

export interface Habit {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  name: string; // TEXT NOT NULL
  description?: string; // TEXT
  target_frequency?: string; // TEXT
  icon?: string; // TEXT
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
}

export interface HabitLog {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  habit_id: string; // UUID NOT NULL
  user_id: string; // TEXT NOT NULL
  log_date: string; // DATE NOT NULL
  status?: string; // TEXT DEFAULT 'pending'
  notes?: string; // TEXT
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  // UNIQUE (habit_id, log_date)
}

export interface MindfulnessExercise {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  title: string; // TEXT NOT NULL UNIQUE
  description?: string; // TEXT
  category?: string; // TEXT
  audio_url?: string; // TEXT
  duration_minutes?: number; // INT
  content_guidance?: string; // TEXT
}

export interface JournalPrompt {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id?: string; // TEXT
  prompt_text: string; // TEXT NOT NULL
  category?: string; // TEXT
  is_predefined?: boolean; // BOOLEAN DEFAULT TRUE
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
}

export interface Theme {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name: string; // TEXT NOT NULL UNIQUE
  description?: string; // TEXT
  css_properties?: Record<string, unknown>; // JSONB
  is_premium?: boolean; // BOOLEAN DEFAULT FALSE
  preview_image_url?: string; // TEXT
}

export interface JournalTemplate {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id?: string; // TEXT
  name: string; // TEXT NOT NULL
  content_structure?: Record<string, unknown>; // JSONB
  is_predefined?: boolean; // BOOLEAN DEFAULT TRUE
  category?: string; // TEXT
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
}

export interface Achievement {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name: string; // TEXT NOT NULL UNIQUE
  description: string; // TEXT NOT NULL
  icon_url?: string; // TEXT
  criteria?: Record<string, unknown>; // JSONB
}

export interface UserAchievement {
  user_id: string; // TEXT NOT NULL
  achievement_id: string; // UUID NOT NULL
  unlocked_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  // PRIMARY KEY (user_id, achievement_id)
}

export interface Reminder {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  reminder_type?: string; // TEXT DEFAULT 'journaling'
  related_item_id?: string; // UUID
  reminder_time?: string; // TIME
  frequency?: string; // TEXT
  custom_days_of_week?: number[]; // SMALLINT[]
  message?: string; // TEXT
  is_active?: boolean; // BOOLEAN DEFAULT TRUE
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
}

export interface SharedEntry {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  entry_id: string; // UUID NOT NULL
  sharer_user_id: string; // TEXT NOT NULL
  shared_with_user_id: string; // TEXT NOT NULL
  permissions?: string; // TEXT DEFAULT 'read_only'
  shared_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  expires_at?: string; // TIMESTAMPTZ
  message?: string; // TEXT
  // UNIQUE (entry_id, shared_with_user_id)
}

export interface Goal {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  title: string; // TEXT NOT NULL
  description?: string; // TEXT
  due_date?: string; // DATE
  status?: string; // TEXT DEFAULT 'active'
  priority?: number; // INT DEFAULT 0
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
}

export interface JournalGoalLink {
  entry_id: string; // UUID NOT NULL
  goal_id: string; // UUID NOT NULL
  user_id: string; // TEXT NOT NULL
  // PRIMARY KEY (entry_id, goal_id)
}

export interface TodoItem {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  entry_id?: string; // UUID
  task_description: string; // TEXT NOT NULL
  is_completed?: boolean; // BOOLEAN DEFAULT FALSE
  due_date?: string; // DATE
  priority?: number; // INT DEFAULT 0
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  completed_at?: string; // TIMESTAMPTZ
  journal_entries?: { title?: string | null } | null; // Added field for linked journal entry title
}

export interface UserIntegration {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  service_name: string; // TEXT NOT NULL
  access_token_encrypted?: string; // TEXT
  refresh_token_encrypted?: string; // TEXT
  external_user_id?: string; // TEXT
  config_details?: Record<string, unknown>; // JSONB
  last_synced_at?: string; // TIMESTAMPTZ
  is_active?: boolean; // BOOLEAN DEFAULT TRUE
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  // UNIQUE(user_id, service_name)
}

export interface MoodLog {
  id?: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id: string; // TEXT NOT NULL
  entry_id?: string; // UUID
  log_date: string; // DATE NOT NULL
  mood_label: string; // TEXT NOT NULL
  intensity?: number; // SMALLINT
  notes?: string; // TEXT
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  // UNIQUE(user_id, log_date)
}

export interface Project {
  id?: string; // UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
  user_id: string; // TEXT NOT NULL
  name: string; // TEXT NOT NULL
  description?: string; // TEXT
  color_hex?: string; // TEXT
  created_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at?: string; // TIMESTAMPTZ DEFAULT NOW()
  // UNIQUE (user_id, name)
}

export interface FacebookShare {
  id?: string; // UUID
  user_id: string; // TEXT
  journal_entry_id: string; // UUID
  facebook_post_id?: string; // TEXT
  preview_image_path: string; // TEXT
  preview_image_url_cached: string; // TEXT
  shared_at?: string; // TIMESTAMPTZ
  share_link_used?: string; // TEXT
  share_caption?: string; // TEXT
  share_description?: string; // TEXT
} 