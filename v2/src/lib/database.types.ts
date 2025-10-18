export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          timezone: string
          preferred_genres: string[]
          writing_frequency: string
          current_streak: number
          longest_streak: number
          last_prompt_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          timezone?: string
          preferred_genres?: string[]
          writing_frequency?: string
          current_streak?: number
          longest_streak?: number
          last_prompt_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          timezone?: string
          preferred_genres?: string[]
          writing_frequency?: string
          current_streak?: number
          longest_streak?: number
          last_prompt_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      series: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          series_id: string | null
          user_id: string
          title: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          series_id?: string | null
          user_id: string
          title: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          series_id?: string | null
          user_id?: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      story_elements: {
        Row: {
          id: string
          book_id: string
          user_id: string
          element_type: 'character' | 'location' | 'plot_point' | 'item' | 'theme'
          name: string
          description: string
          notes: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          user_id: string
          element_type: 'character' | 'location' | 'plot_point' | 'item' | 'theme'
          name: string
          description?: string
          notes?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          user_id?: string
          element_type?: 'character' | 'location' | 'plot_point' | 'item' | 'theme'
          name?: string
          description?: string
          notes?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          book_id: string | null
          prompt_text: string
          prompt_type: 'character_deep_dive' | 'plot_development' | 'worldbuilding' | 'dialogue' | 'conflict_theme' | 'general'
          prompt_mode: string | null
          element_references: string[]
          generated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id?: string | null
          prompt_text: string
          prompt_type?: 'character_deep_dive' | 'plot_development' | 'worldbuilding' | 'dialogue' | 'conflict_theme' | 'general'
          prompt_mode?: string | null
          element_references?: string[]
          generated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string | null
          prompt_text?: string
          prompt_type?: 'character_deep_dive' | 'plot_development' | 'worldbuilding' | 'dialogue' | 'conflict_theme' | 'general'
          prompt_mode?: string | null
          element_references?: string[]
          generated_at?: string
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          prompt_id: string
          user_id: string
          response_text: string
          element_tags: string[]
          word_count: number
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          user_id: string
          response_text: string
          element_tags?: string[]
          word_count?: number
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          user_id?: string
          response_text?: string
          element_tags?: string[]
          word_count?: number
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          default_prompt_mode: string
          daily_reminder_enabled: boolean
          reminder_time: string | null
          dark_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          default_prompt_mode?: string
          daily_reminder_enabled?: boolean
          reminder_time?: string | null
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          default_prompt_mode?: string
          daily_reminder_enabled?: boolean
          reminder_time?: string | null
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
