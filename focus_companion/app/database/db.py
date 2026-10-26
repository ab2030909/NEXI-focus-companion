"""
Database connection and schema initialization for Focus Companion.
Uses SQLite stored safely in Windows %APPDATA%/FocusCompanion/focus_companion.db
"""

import os
import sqlite3
from pathlib import Path
from typing import Optional


def get_data_dir() -> Path:
    """Returns local app data path in user's APPDATA or home directory."""
    app_data = os.environ.get("APPDATA")
    if app_data:
        base_dir = Path(app_data) / "FocusCompanion"
    else:
        base_dir = Path.home() / ".focus_companion"
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir


def get_db_path() -> Path:
    """Returns SQLite database path."""
    env_path = os.environ.get("FOCUS_COMPANION_DB")
    if env_path:
        p = Path(env_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        return p
    return get_data_dir() / "focus_companion.db"


class Database:
    _instance: Optional["Database"] = None

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or get_db_path()
        self._init_schema()

    @classmethod
    def get_instance(cls, db_path: Optional[Path] = None) -> "Database":
        if cls._instance is None:
            cls._instance = cls(db_path)
        return cls._instance

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=30.0)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("PRAGMA busy_timeout = 5000;")
            conn.execute("PRAGMA foreign_keys = ON;")
        except Exception:
            pass
        return conn

    def _init_schema(self):
        """Creates tables, indexes, and default profiles/categories."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # 1. Categories
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                color TEXT DEFAULT '#929292',
                is_productive INTEGER DEFAULT 0  -- 1: productive, 0: neutral, -1: distracting
            );
            """)

            # 2. Application and website classification rules
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT UNIQUE NOT NULL,    -- app name or domain (e.g. 'code.exe', 'youtube.com')
                rule_type TEXT NOT NULL,         -- 'app' or 'domain'
                category_name TEXT NOT NULL,
                classification INTEGER DEFAULT 0, -- 1: productive, 0: neutral, -1: distracting
                daily_limit_min INTEGER DEFAULT 0, -- 0 = no limit
                continuous_limit_min INTEGER DEFAULT 0, -- 0 = no limit
                is_excluded INTEGER DEFAULT 0,    -- 1 = don't track
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 3. Activity intervals (Foreground events)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                app_name TEXT NOT NULL,
                process_name TEXT NOT NULL,
                window_title TEXT DEFAULT '',
                domain TEXT DEFAULT '',
                category_name TEXT DEFAULT 'Other',
                classification INTEGER DEFAULT 0,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                duration_sec INTEGER NOT NULL,
                is_idle INTEGER DEFAULT 0,
                in_focus_session INTEGER DEFAULT 0
            );
            """)

            cursor.execute("CREATE INDEX IF NOT EXISTS idx_act_start ON activities(start_time);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_act_app ON activities(app_name);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_act_domain ON activities(domain);")

            # 4. Focus Profiles
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS focus_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT DEFAULT '',
                default_duration_min INTEGER DEFAULT 25,
                break_duration_min INTEGER DEFAULT 5,
                allowed_apps TEXT DEFAULT '',        -- comma separated
                restricted_domains TEXT DEFAULT '',  -- comma separated
                distraction_threshold_sec INTEGER DEFAULT 60,
                intervention_style TEXT DEFAULT 'nudge', -- 'nudge', 'reminder', 'strict'
                is_default INTEGER DEFAULT 0
            );
            """)

            # 5. Focus Sessions
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS focus_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT DEFAULT 'Focus Sprint',
                profile_name TEXT NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                planned_duration_min INTEGER NOT NULL,
                actual_duration_sec INTEGER DEFAULT 0,
                completed INTEGER DEFAULT 0,
                distraction_count INTEGER DEFAULT 0,
                notes TEXT DEFAULT ''
            );
            """)

            # 6. Distraction Interventions Log
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS interventions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER,
                trigger_source TEXT NOT NULL,   -- app or domain
                intervention_level TEXT NOT NULL, -- 'nudge', 'reminder', 'strict'
                action_taken TEXT NOT NULL,     -- 'dismissed', 'break', 'paused', 'snoozed'
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(session_id) REFERENCES focus_sessions(id) ON DELETE SET NULL
            );
            """)

            # 7. Intent Sessions
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS intent_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT NOT NULL,
                intent_note TEXT NOT NULL,
                budget_minutes INTEGER NOT NULL,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                status TEXT DEFAULT 'active' -- 'active', 'completed', 'exceeded'
            );
            """)

            # 8. User Settings
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """)

            # 9. Timers and Alarms (Extended manager supporting Interval & Scheduled Time modes)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS custom_timers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                mode TEXT NOT NULL DEFAULT 'interval', -- 'interval' or 'scheduled'
                interval_min INTEGER DEFAULT 30,
                target_time TEXT DEFAULT '17:00',      -- 'HH:MM'
                notification_type TEXT DEFAULT 'toast', -- 'toast', 'tray', 'dialog'
                is_enabled INTEGER DEFAULT 1,
                last_triggered TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 10. Watched Websites Management
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS watched_sites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                display_name TEXT NOT NULL,
                hostname TEXT UNIQUE NOT NULL,         -- normalized hostname e.g. 'youtube.com'
                daily_limit_min INTEGER DEFAULT 30,     -- 0 = unlimited / watch only
                is_enabled INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 11. Site Exclusions (Never Track These Sites)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS site_exclusions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hostname TEXT UNIQUE NOT NULL,
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 12. Reminders (legacy compatibility table)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                reminder_type TEXT NOT NULL,    -- 'interval', 'break', 'daily'
                interval_min INTEGER DEFAULT 60,
                is_enabled INTEGER DEFAULT 1,
                last_triggered TIMESTAMP
            );
            """)

            # Seed default categories if empty
            cursor.execute("SELECT COUNT(*) FROM categories;")
            if cursor.fetchone()[0] == 0:
                default_categories = [
                    ("Coding", "#4CAF50", 1),
                    ("Productivity", "#2196F3", 1),
                    ("Education", "#00BCD4", 1),
                    ("Communication", "#9C27B0", 0),
                    ("Other", "#9E9E9E", 0),
                    ("Entertainment", "#FF9800", -1),
                    ("Social Media", "#F44336", -1),
                    ("Gaming", "#E91E63", -1)
                ]
                cursor.executemany(
                    "INSERT INTO categories (name, color, is_productive) VALUES (?, ?, ?);",
                    default_categories
                )

            # Seed default focus profiles
            cursor.execute("SELECT COUNT(*) FROM focus_profiles;")
            if cursor.fetchone()[0] == 0:
                default_profiles = [
                    ("Deep Work", "Strict focus on essential tools with zero distraction tolerance.", 45, 5,
                     "Code.exe,devenv.exe,pycharm64.exe,cmd.exe,powershell.exe,WindowsTerminal.exe",
                     "youtube.com,twitter.com,x.com,reddit.com,facebook.com,instagram.com,tiktok.com,netflix.com",
                     30, "strict", 1),
                    ("Coding", "Prioritize development IDEs, terminals, docs, and git tools.", 50, 10,
                     "Code.exe,devenv.exe,pycharm64.exe,WindowsTerminal.exe,github.com",
                     "twitter.com,x.com,facebook.com,instagram.com,tiktok.com",
                     60, "reminder", 0),
                    ("Study", "Focus on reading, writing, note taking and educational research.", 30, 5,
                     "Obsidian.exe,Notion.exe,AcroRd32.exe,msedge.exe,chrome.exe",
                     "youtube.com,instagram.com,tiktok.com,gaming.com",
                     45, "reminder", 0),
                    ("Relax", "Casual browsing and entertainment without harsh limits.", 25, 5,
                     "", "", 300, "nudge", 0),
                    ("Custom", "Configurable custom focus profile.", 25, 5, "", "", 60, "nudge", 0)
                ]
                cursor.executemany("""
                INSERT INTO focus_profiles (
                    name, description, default_duration_min, break_duration_min,
                    allowed_apps, restricted_domains, distraction_threshold_sec,
                    intervention_style, is_default
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, default_profiles)

            # Seed common default rules
            cursor.execute("SELECT COUNT(*) FROM rules;")
            if cursor.fetchone()[0] == 0:
                default_rules = [
                    ("code.exe", "app", "Coding", 1, 0, 0, 0),
                    ("devenv.exe", "app", "Coding", 1, 0, 0, 0),
                    ("windowsterminal.exe", "app", "Coding", 1, 0, 0, 0),
                    ("powershell.exe", "app", "Coding", 1, 0, 0, 0),
                    ("pycharm64.exe", "app", "Coding", 1, 0, 0, 0),
                    ("obsidian.exe", "app", "Productivity", 1, 0, 0, 0),
                    ("notion.exe", "app", "Productivity", 1, 0, 0, 0),
                    ("slack.exe", "app", "Communication", 0, 0, 0, 0),
                    ("discord.exe", "app", "Communication", 0, 60, 0, 0),
                    ("spotify.exe", "app", "Entertainment", 0, 0, 0, 0),
                    ("steam.exe", "app", "Gaming", -1, 30, 0, 0),
                    ("youtube.com", "domain", "Entertainment", -1, 45, 20, 0),
                    ("twitter.com", "domain", "Social Media", -1, 20, 10, 0),
                    ("x.com", "domain", "Social Media", -1, 20, 10, 0),
                    ("reddit.com", "domain", "Social Media", -1, 30, 15, 0),
                    ("instagram.com", "domain", "Social Media", -1, 15, 5, 0),
                    ("tiktok.com", "domain", "Social Media", -1, 15, 5, 0),
                    ("netflix.com", "domain", "Entertainment", -1, 60, 0, 0),
                    ("github.com", "domain", "Coding", 1, 0, 0, 0),
                    ("stackoverflow.com", "domain", "Coding", 1, 0, 0, 0)
                ]
                cursor.executemany("""
                INSERT OR IGNORE INTO rules (
                    pattern, rule_type, category_name, classification,
                    daily_limit_min, continuous_limit_min, is_excluded
                ) VALUES (?, ?, ?, ?, ?, ?, ?);
                """, default_rules)

            # Seed default settings
            default_settings = [
                ("user_display_name", "Explorer"),
                ("tracking_enabled", "true"),
                ("track_apps_enabled", "true"),
                ("idle_threshold_sec", "180"),
                ("minimize_to_tray", "true"),
                ("start_with_windows", "false"),
                ("browser_tracking_enabled", "true"),
                ("daily_focus_goal_min", "120"),
                ("groq_api_key", ""),
                ("groq_model", "openai/gpt-oss-120b"),
                ("ai_consent_given", "false"),
                ("extension_port", "19876"),
                ("floating_mascot_enabled", "true"),
                ("quiet_hours_enabled", "false"),
                ("quiet_hours_start", "22:00"),
                ("quiet_hours_end", "07:00"),
                # Reminders & Attention
                ("reminders_enabled", "true"),
                ("fullscreen_lockdown_enabled", "false"),
                ("lockdown_countdown_sec", "15"),
                ("pause_video_enabled", "false"),
                ("snooze_duration_min", "5"),
                ("reminders_paused_until", ""),
                ("important_exemption_until", ""),
                # Shorts & Video limits
                ("shorts_continuous_limit_min", "10"),
                ("shorts_daily_budget_min", "30"),
                ("shorts_session_reset_interval_min", "5")
            ]
            for key, val in default_settings:
                cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);", (key, val))

            # Seed default watched websites if empty
            cursor.execute("SELECT COUNT(*) FROM watched_sites;")
            if cursor.fetchone()[0] == 0:
                default_watched = [
                    ("YouTube", "youtube.com", 45, 1),
                    ("Reddit", "reddit.com", 30, 1),
                    ("Twitter / X", "x.com", 20, 1),
                    ("Instagram", "instagram.com", 15, 1),
                    ("TikTok", "tiktok.com", 15, 1)
                ]
                cursor.executemany("""
                INSERT OR IGNORE INTO watched_sites (display_name, hostname, daily_limit_min, is_enabled)
                VALUES (?, ?, ?, ?);
                """, default_watched)

            # Seed default timers if empty
            cursor.execute("SELECT COUNT(*) FROM custom_timers;")
            if cursor.fetchone()[0] == 0:
                default_timers = [
                    ("Posture & Eye Break", "interval", 30, "17:00", "toast", 1),
                    ("End of Workday Review", "scheduled", 60, "17:30", "toast", 1)
                ]
                cursor.executemany("""
                INSERT OR IGNORE INTO custom_timers (name, mode, interval_min, target_time, notification_type, is_enabled)
                VALUES (?, ?, ?, ?, ?, ?);
                """, default_timers)

            # Seed default reminder
            cursor.execute("SELECT COUNT(*) FROM reminders;")
            if cursor.fetchone()[0] == 0:
                cursor.execute("""
                INSERT INTO reminders (title, message, reminder_type, interval_min, is_enabled)
                VALUES ('Eye & Posture Break', 'Time to rest your eyes for 20 seconds and stretch.', 'interval', 45, 1);
                """)

            conn.commit()
