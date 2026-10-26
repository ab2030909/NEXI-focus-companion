"""
Data repository layer for queries, analytics aggregations, rules, and settings.
"""

from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from focus_companion.app.database.db import Database


class Repository:
    def __init__(self, db: Optional[Database] = None):
        self.db = db or Database.get_instance()

    # --- SETTINGS ---
    def get_setting(self, key: str, default: str = "") -> str:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key = ?;", (key,))
            row = cursor.fetchone()
            return row["value"] if row else default

    def set_setting(self, key: str, value: str):
        with self.db.get_connection() as conn:
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);", (key, value))
            conn.commit()

    def get_all_settings(self) -> Dict[str, str]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT key, value FROM settings;")
            return {row["key"]: row["value"] for row in cursor.fetchall()}

    # --- CATEGORIES & RULES ---
    def get_categories(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM categories ORDER BY name ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def add_category(self, name: str, color: str = "#929292", is_productive: int = 0):
        with self.db.get_connection() as conn:
            conn.execute("INSERT OR IGNORE INTO categories (name, color, is_productive) VALUES (?, ?, ?);",
                         (name, color, is_productive))
            conn.commit()

    def get_rules(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM rules ORDER BY rule_type ASC, pattern ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def add_or_update_rule(self, pattern: str, rule_type: str, category_name: str,
                           classification: int, daily_limit_min: int = 0,
                           continuous_limit_min: int = 0, is_excluded: int = 0):
        pattern = pattern.lower().strip()
        with self.db.get_connection() as conn:
            conn.execute("""
            INSERT INTO rules (pattern, rule_type, category_name, classification, daily_limit_min, continuous_limit_min, is_excluded)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(pattern) DO UPDATE SET
                rule_type=excluded.rule_type,
                category_name=excluded.category_name,
                classification=excluded.classification,
                daily_limit_min=excluded.daily_limit_min,
                continuous_limit_min=excluded.continuous_limit_min,
                is_excluded=excluded.is_excluded;
            """, (pattern, rule_type, category_name, classification, daily_limit_min, continuous_limit_min, is_excluded))
            conn.commit()

    def delete_rule(self, pattern: str):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM rules WHERE pattern = ?;", (pattern.lower().strip(),))
            conn.commit()

    def match_rule(self, app_name: str, domain: str = "") -> Tuple[str, int, int, int, bool]:
        """
        Returns (category_name, classification, daily_limit_min, continuous_limit_min, is_excluded).
        Prioritizes domain rule over app rule if domain is present.
        """
        domain_clean = domain.lower().strip()
        app_clean = app_name.lower().strip()

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            if domain_clean:
                # Check exact domain match or suffix
                cursor.execute("SELECT * FROM rules WHERE rule_type = 'domain';")
                for row in cursor.fetchall():
                    pat = row["pattern"]
                    if domain_clean == pat or domain_clean.endswith("." + pat):
                        return (row["category_name"], row["classification"],
                                row["daily_limit_min"], row["continuous_limit_min"], bool(row["is_excluded"]))

            # Match application name
            cursor.execute("SELECT * FROM rules WHERE rule_type = 'app' AND (pattern = ? OR pattern = ?);",
                           (app_clean, app_clean.replace(".exe", "")))
            row = cursor.fetchone()
            if row:
                return (row["category_name"], row["classification"],
                        row["daily_limit_min"], row["continuous_limit_min"], bool(row["is_excluded"]))

        # Default fallback
        return ("Other", 0, 0, 0, False)

    # --- ACTIVITIES ---
    def record_activity(self, app_name: str, process_name: str, window_title: str,
                        domain: str, category_name: str, classification: int,
                        start_time: datetime, end_time: datetime, duration_sec: int,
                        is_idle: bool = False, in_focus_session: bool = False):
        if duration_sec <= 0:
            return
        with self.db.get_connection() as conn:
            conn.execute("""
            INSERT INTO activities (
                app_name, process_name, window_title, domain,
                category_name, classification, start_time, end_time,
                duration_sec, is_idle, in_focus_session
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                app_name, process_name, window_title, domain,
                category_name, classification,
                start_time.strftime("%Y-%m-%d %H:%M:%S"),
                end_time.strftime("%Y-%m-%d %H:%M:%S"),
                duration_sec,
                1 if is_idle else 0,
                1 if in_focus_session else 0
            ))
            conn.commit()

    def get_today_activities(self, limit: int = 100) -> List[Dict[str, Any]]:
        today_str = date.today().strftime("%Y-%m-%d")
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM activities 
            WHERE start_time >= ? 
            ORDER BY start_time DESC 
            LIMIT ?;
            """, (f"{today_str} 00:00:00", limit))
            return [dict(row) for row in cursor.fetchall()]

    def get_activities_by_date(self, target_date: date, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        start_str = f"{target_date.strftime('%Y-%m-%d')} 00:00:00"
        end_str = f"{target_date.strftime('%Y-%m-%d')} 23:59:59"
        query = "SELECT * FROM activities WHERE start_time BETWEEN ? AND ?"
        params: List[Any] = [start_str, end_str]
        if category_filter and category_filter != "All":
            query += " AND category_name = ?"
            params.append(category_filter)
        query += " ORDER BY start_time DESC;"

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    def get_today_summary(self) -> Dict[str, Any]:
        """Calculates today's total active, idle, productive, neutral, and distracting seconds."""
        today_str = date.today().strftime("%Y-%m-%d")
        start_str = f"{today_str} 00:00:00"

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT 
                SUM(CASE WHEN is_idle = 0 THEN duration_sec ELSE 0 END) as active_sec,
                SUM(CASE WHEN is_idle = 1 THEN duration_sec ELSE 0 END) as idle_sec,
                SUM(CASE WHEN is_idle = 0 AND classification = 1 THEN duration_sec ELSE 0 END) as productive_sec,
                SUM(CASE WHEN is_idle = 0 AND classification = 0 THEN duration_sec ELSE 0 END) as neutral_sec,
                SUM(CASE WHEN is_idle = 0 AND classification = -1 THEN duration_sec ELSE 0 END) as distracting_sec
            FROM activities
            WHERE start_time >= ?;
            """, (start_str,))
            row = cursor.fetchone()
            active_sec = row["active_sec"] or 0
            idle_sec = row["idle_sec"] or 0
            prod_sec = row["productive_sec"] or 0
            neutral_sec = row["neutral_sec"] or 0
            dist_sec = row["distracting_sec"] or 0

            # Today's focus sessions
            cursor.execute("""
            SELECT SUM(actual_duration_sec) as focus_sec, COUNT(*) as session_count
            FROM focus_sessions
            WHERE start_time >= ? AND completed = 1;
            """, (start_str,))
            f_row = cursor.fetchone()
            focus_sec = f_row["focus_sec"] or 0
            focus_count = f_row["session_count"] or 0

            return {
                "active_sec": active_sec,
                "idle_sec": idle_sec,
                "productive_sec": prod_sec,
                "neutral_sec": neutral_sec,
                "distracting_sec": dist_sec,
                "focus_sec": focus_sec,
                "focus_count": focus_count
            }

    def get_top_apps(self, target_date: Optional[date] = None, limit: int = 5) -> List[Dict[str, Any]]:
        target_date = target_date or date.today()
        start_str = f"{target_date.strftime('%Y-%m-%d')} 00:00:00"
        end_str = f"{target_date.strftime('%Y-%m-%d')} 23:59:59"

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT app_name, category_name, classification, SUM(duration_sec) as total_sec
            FROM activities
            WHERE start_time BETWEEN ? AND ? AND is_idle = 0
            GROUP BY app_name
            ORDER BY total_sec DESC
            LIMIT ?;
            """, (start_str, end_str, limit))
            return [dict(row) for row in cursor.fetchall()]

    def get_top_domains(self, target_date: Optional[date] = None, limit: int = 5) -> List[Dict[str, Any]]:
        target_date = target_date or date.today()
        start_str = f"{target_date.strftime('%Y-%m-%d')} 00:00:00"
        end_str = f"{target_date.strftime('%Y-%m-%d')} 23:59:59"

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT domain, category_name, classification, SUM(duration_sec) as total_sec
            FROM activities
            WHERE start_time BETWEEN ? AND ? AND domain != '' AND is_idle = 0
            GROUP BY domain
            ORDER BY total_sec DESC
            LIMIT ?;
            """, (start_str, end_str, limit))
            return [dict(row) for row in cursor.fetchall()]

    def get_hourly_breakdown(self, target_date: date) -> List[Dict[str, Any]]:
        """Returns 24 hours of productive, neutral, and distracting seconds."""
        start_str = f"{target_date.strftime('%Y-%m-%d')} 00:00:00"
        end_str = f"{target_date.strftime('%Y-%m-%d')} 23:59:59"

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT 
                strftime('%H', start_time) as hour,
                SUM(CASE WHEN classification = 1 THEN duration_sec ELSE 0 END) as prod_sec,
                SUM(CASE WHEN classification = 0 THEN duration_sec ELSE 0 END) as neutral_sec,
                SUM(CASE WHEN classification = -1 THEN duration_sec ELSE 0 END) as dist_sec
            FROM activities
            WHERE start_time BETWEEN ? AND ? AND is_idle = 0
            GROUP BY hour
            ORDER BY hour ASC;
            """, (start_str, end_str))
            
            rows = {int(row["hour"]): dict(row) for row in cursor.fetchall()}
            result = []
            for h in range(24):
                if h in rows:
                    result.append(rows[h])
                else:
                    result.append({"hour": f"{h:02d}", "prod_sec": 0, "neutral_sec": 0, "dist_sec": 0})
            return result

    def get_weekly_trend(self) -> List[Dict[str, Any]]:
        """Returns the last 7 days metrics."""
        today = date.today()
        start_date = today - timedelta(days=6)
        start_str = f"{start_date.strftime('%Y-%m-%d')} 00:00:00"

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT 
                strftime('%Y-%m-%d', start_time) as day_str,
                SUM(CASE WHEN is_idle = 0 THEN duration_sec ELSE 0 END) as active_sec,
                SUM(CASE WHEN is_idle = 0 AND classification = 1 THEN duration_sec ELSE 0 END) as prod_sec,
                SUM(CASE WHEN is_idle = 0 AND classification = -1 THEN duration_sec ELSE 0 END) as dist_sec
            FROM activities
            WHERE start_time >= ?
            GROUP BY day_str
            ORDER BY day_str ASC;
            """, (start_str,))
            rows = {row["day_str"]: dict(row) for row in cursor.fetchall()}

            result = []
            for i in range(7):
                d = start_date + timedelta(days=i)
                d_str = d.strftime("%Y-%m-%d")
                if d_str in rows:
                    item = rows[d_str]
                    item["date"] = d
                    item["label"] = d.strftime("%a")
                    result.append(item)
                else:
                    result.append({
                        "day_str": d_str,
                        "date": d,
                        "label": d.strftime("%a"),
                        "active_sec": 0,
                        "prod_sec": 0,
                        "dist_sec": 0
                    })
            return result

    # --- ADVANCED PERIOD ANALYTICS (RADAR DASHBOARD) ---
    def get_period_summary(self, days: int = 1) -> Dict[str, Any]:
        """
        Calculates summary for 1 (today), 7, or 30 days.
        Returns:
            active_sec, productive_sec, neutral_sec, distracting_sec,
            focus_sec, focus_count, top_app, most_distracting_site,
            peak_hour, daily_focus_trend
        """
        today = date.today()
        if days <= 1:
            start_str = f"{today.strftime('%Y-%m-%d')} 00:00:00"
        else:
            start_date = today - timedelta(days=days - 1)
            start_str = f"{start_date.strftime('%Y-%m-%d')} 00:00:00"

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT 
                SUM(CASE WHEN is_idle = 0 THEN duration_sec ELSE 0 END) as active_sec,
                SUM(CASE WHEN is_idle = 1 THEN duration_sec ELSE 0 END) as idle_sec,
                SUM(CASE WHEN is_idle = 0 AND classification = 1 THEN duration_sec ELSE 0 END) as productive_sec,
                SUM(CASE WHEN is_idle = 0 AND classification = 0 THEN duration_sec ELSE 0 END) as neutral_sec,
                SUM(CASE WHEN is_idle = 0 AND classification = -1 THEN duration_sec ELSE 0 END) as distracting_sec
            FROM activities
            WHERE start_time >= ?;
            """, (start_str,))
            row = cursor.fetchone()
            active_sec = (row["active_sec"] or 0) if row else 0
            idle_sec = (row["idle_sec"] or 0) if row else 0
            prod_sec = (row["productive_sec"] or 0) if row else 0
            neutral_sec = (row["neutral_sec"] or 0) if row else 0
            dist_sec = (row["distracting_sec"] or 0) if row else 0

            # Focus sessions
            cursor.execute("""
            SELECT SUM(actual_duration_sec) as focus_sec, COUNT(*) as session_count
            FROM focus_sessions
            WHERE start_time >= ? AND completed = 1;
            """, (start_str,))
            f_row = cursor.fetchone()
            focus_sec = (f_row["focus_sec"] or 0) if f_row else 0
            focus_count = (f_row["session_count"] or 0) if f_row else 0

            # Top active app
            cursor.execute("""
            SELECT app_name, SUM(duration_sec) as total_sec
            FROM activities
            WHERE start_time >= ? AND is_idle = 0
            GROUP BY app_name
            ORDER BY total_sec DESC
            LIMIT 1;
            """, (start_str,))
            top_app_row = cursor.fetchone()
            top_app = top_app_row["app_name"] if top_app_row else "—"

            # Most distracting website
            cursor.execute("""
            SELECT domain, SUM(duration_sec) as total_sec
            FROM activities
            WHERE start_time >= ? AND domain != '' AND is_idle = 0 AND classification = -1
            GROUP BY domain
            ORDER BY total_sec DESC
            LIMIT 1;
            """, (start_str,))
            top_dist_row = cursor.fetchone()
            most_distracting_site = top_dist_row["domain"] if top_dist_row else "None"

            # Peak activity hour
            cursor.execute("""
            SELECT strftime('%H', start_time) as hr, SUM(duration_sec) as total_sec
            FROM activities
            WHERE start_time >= ? AND is_idle = 0
            GROUP BY hr
            ORDER BY total_sec DESC
            LIMIT 1;
            """, (start_str,))
            peak_row = cursor.fetchone()
            if peak_row and peak_row["hr"] is not None:
                hr_int = int(peak_row["hr"])
                am_pm = "AM" if hr_int < 12 else "PM"
                display_hr = hr_int % 12
                if display_hr == 0:
                    display_hr = 12
                peak_hour = f"{display_hr}:00 {am_pm}"
            else:
                peak_hour = "—"

            # Daily focus trend (calculated: compare focus or productive ratio with previous equivalent period)
            # Or trend direction in recent days
            trend_str = "Stable"
            if days == 1:
                # Compare today's productive percentage with yesterday
                yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
                cursor.execute("""
                SELECT 
                    SUM(CASE WHEN is_idle = 0 THEN duration_sec ELSE 0 END) as act,
                    SUM(CASE WHEN is_idle = 0 AND classification = 1 THEN duration_sec ELSE 0 END) as prod
                FROM activities
                WHERE start_time BETWEEN ? AND ?;
                """, (f"{yesterday_str} 00:00:00", f"{yesterday_str} 23:59:59"))
                y_row = cursor.fetchone()
                y_act = (y_row["act"] or 0) if y_row else 0
                y_prod = (y_row["prod"] or 0) if y_row else 0
                today_rate = (prod_sec / active_sec) if active_sec > 0 else 0
                y_rate = (y_prod / y_act) if y_act > 0 else 0
                if active_sec > 0:
                    diff = int((today_rate - y_rate) * 100)
                    if diff > 0:
                        trend_str = f"+{diff}% vs yest."
                    elif diff < 0:
                        trend_str = f"{diff}% vs yest."
                    else:
                        trend_str = "Consistent"
            else:
                # Over multi-day, compute ratio of productive to active
                prod_ratio = int((prod_sec / active_sec * 100)) if active_sec > 0 else 0
                trend_str = f"{prod_ratio}% prod rate"

            return {
                "active_sec": active_sec,
                "idle_sec": idle_sec,
                "productive_sec": prod_sec,
                "neutral_sec": neutral_sec,
                "distracting_sec": dist_sec,
                "focus_sec": focus_sec,
                "focus_count": focus_count,
                "top_app": top_app,
                "most_distracting_site": most_distracting_site,
                "peak_hour": peak_hour,
                "daily_focus_trend": trend_str
            }

    def get_period_hourly(self, days: int = 1) -> List[Dict[str, Any]]:
        """
        Returns 24 hours of aggregated activity (prod_sec, neutral_sec, dist_sec)
        for the given period (1, 7, or 30 days).
        """
        today = date.today()
        if days <= 1:
            start_str = f"{today.strftime('%Y-%m-%d')} 00:00:00"
        else:
            start_date = today - timedelta(days=days - 1)
            start_str = f"{start_date.strftime('%Y-%m-%d')} 00:00:00"

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT 
                strftime('%H', start_time) as hour,
                SUM(CASE WHEN classification = 1 THEN duration_sec ELSE 0 END) as prod_sec,
                SUM(CASE WHEN classification = 0 THEN duration_sec ELSE 0 END) as neutral_sec,
                SUM(CASE WHEN classification = -1 THEN duration_sec ELSE 0 END) as dist_sec
            FROM activities
            WHERE start_time >= ? AND is_idle = 0
            GROUP BY hour
            ORDER BY hour ASC;
            """, (start_str,))
            rows = {int(row["hour"]): dict(row) for row in cursor.fetchall()}
            result = []
            for h in range(24):
                if h in rows:
                    result.append(rows[h])
                else:
                    result.append({"hour": f"{h:02d}", "prod_sec": 0, "neutral_sec": 0, "dist_sec": 0})
            return result

    def get_period_breakdown(self, days: int = 1, filter_type: str = "all") -> List[Dict[str, Any]]:
        """
        Returns ranked apps and/or websites by actual active duration.
        filter_type: 'all', 'apps', 'sites'
        Each row contains:
            name, type ('app' or 'site'), category_name, classification,
            total_sec, percent (calculated against total active time in period)
        """
        today = date.today()
        if days <= 1:
            start_str = f"{today.strftime('%Y-%m-%d')} 00:00:00"
        else:
            start_date = today - timedelta(days=days - 1)
            start_str = f"{start_date.strftime('%Y-%m-%d')} 00:00:00"

        items: List[Dict[str, Any]] = []

        with self.db.get_connection() as conn:
            cursor = conn.cursor()

            # First get total active time for period percentage calculation
            cursor.execute("""
            SELECT SUM(duration_sec) as total_sec
            FROM activities
            WHERE start_time >= ? AND is_idle = 0;
            """, (start_str,))
            total_period_sec = (cursor.fetchone()["total_sec"] or 0)

            if filter_type in ("all", "apps"):
                cursor.execute("""
                SELECT 
                    app_name as name, 
                    category_name, 
                    classification, 
                    SUM(duration_sec) as total_sec
                FROM activities
                WHERE start_time >= ? AND is_idle = 0
                GROUP BY app_name
                ORDER BY total_sec DESC;
                """, (start_str,))
                for row in cursor.fetchall():
                    items.append({
                        "name": row["name"],
                        "type": "app",
                        "category_name": row["category_name"] or "General",
                        "classification": row["classification"] or 0,
                        "total_sec": row["total_sec"] or 0,
                        "percent": (row["total_sec"] / total_period_sec * 100) if total_period_sec > 0 else 0
                    })

            if filter_type in ("all", "sites"):
                cursor.execute("""
                SELECT 
                    domain as name, 
                    category_name, 
                    classification, 
                    SUM(duration_sec) as total_sec
                FROM activities
                WHERE start_time >= ? AND domain != '' AND is_idle = 0
                GROUP BY domain
                ORDER BY total_sec DESC;
                """, (start_str,))
                for row in cursor.fetchall():
                    items.append({
                        "name": row["name"],
                        "type": "site",
                        "category_name": row["category_name"] or "Web",
                        "classification": row["classification"] or 0,
                        "total_sec": row["total_sec"] or 0,
                        "percent": (row["total_sec"] / total_period_sec * 100) if total_period_sec > 0 else 0
                    })

        # Sort combined results descending by total_sec
        items.sort(key=lambda x: x["total_sec"], reverse=True)
        return items


    # --- FOCUS PROFILES & SESSIONS ---
    def get_profiles(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM focus_profiles ORDER BY is_default DESC, name ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def get_profile_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM focus_profiles WHERE name = ?;", (name,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def create_focus_session(self, name: str, profile_name: str, planned_duration_min: int) -> int:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO focus_sessions (name, profile_name, start_time, planned_duration_min)
            VALUES (?, ?, ?, ?);
            """, (name, profile_name, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), planned_duration_min))
            conn.commit()
            return cursor.lastrowid

    def update_focus_session(self, session_id: int, actual_duration_sec: int,
                              completed: bool = False, notes: str = "", distraction_count: int = 0):
        with self.db.get_connection() as conn:
            conn.execute("""
            UPDATE focus_sessions SET
                end_time = ?,
                actual_duration_sec = ?,
                completed = ?,
                notes = ?,
                distraction_count = ?
            WHERE id = ?;
            """, (
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                actual_duration_sec,
                1 if completed else 0,
                notes,
                distraction_count,
                session_id
            ))
            conn.commit()

    def get_recent_focus_sessions(self, limit: int = 10) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM focus_sessions 
            ORDER BY start_time DESC 
            LIMIT ?;
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    # --- INTERVENTIONS & INTENT ---
    def log_intervention(self, session_id: Optional[int], trigger_source: str,
                         level: str, action: str):
        with self.db.get_connection() as conn:
            conn.execute("""
            INSERT INTO interventions (session_id, trigger_source, intervention_level, action_taken)
            VALUES (?, ?, ?, ?);
            """, (session_id, trigger_source, level, action))
            conn.commit()

    def get_today_interventions_count(self) -> int:
        today_str = date.today().strftime("%Y-%m-%d")
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM interventions WHERE timestamp >= ?;", (f"{today_str} 00:00:00",))
            return cursor.fetchone()[0]

    def create_intent_session(self, domain: str, note: str, budget_min: int) -> int:
        # First close any previously active intent sessions to prevent duplicate active sessions
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE intent_sessions SET end_time = CURRENT_TIMESTAMP, status = 'cancelled'
            WHERE status IN ('active', 'paused');
            """)
            cursor.execute("""
            INSERT INTO intent_sessions (domain, intent_note, budget_minutes, status)
            VALUES (?, ?, ?, 'active');
            """, (domain.lower().strip() if domain else "", note.strip(), budget_min))
            conn.commit()
            return cursor.lastrowid

    def get_active_intent(self, domain: Optional[str] = None) -> Optional[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            if domain:
                cursor.execute("""
                SELECT * FROM intent_sessions 
                WHERE domain = ? AND status IN ('active', 'paused')
                ORDER BY start_time DESC LIMIT 1;
                """, (domain.lower().strip(),))
            else:
                cursor.execute("""
                SELECT * FROM intent_sessions 
                WHERE status IN ('active', 'paused')
                ORDER BY start_time DESC LIMIT 1;
                """)
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_intent_status(self, intent_id: int, status: str):
        with self.db.get_connection() as conn:
            conn.execute("""
            UPDATE intent_sessions SET status = ? WHERE id = ?;
            """, (status, intent_id))
            conn.commit()

    def close_intent_session(self, intent_id: int, status: str = 'completed'):
        with self.db.get_connection() as conn:
            conn.execute("""
            UPDATE intent_sessions SET end_time = CURRENT_TIMESTAMP, status = ?
            WHERE id = ?;
            """, (status, intent_id))
            conn.commit()

    # --- REMINDERS ---
    def get_reminders(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM reminders ORDER BY id ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def update_reminder_triggered(self, reminder_id: int):
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self.db.get_connection() as conn:
            conn.execute("UPDATE reminders SET last_triggered = ? WHERE id = ?;", (ts, reminder_id))
            conn.commit()

    # --- WATCHED WEBSITES ---
    def get_watched_sites(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM watched_sites ORDER BY display_name ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def add_or_update_watched_site(self, display_name: str, hostname: str, daily_limit_min: int = 30, is_enabled: int = 1):
        clean_host = hostname.lower().strip().replace("http://", "").replace("https://", "").split("/")[0]
        if clean_host.startswith("www."):
            clean_host = clean_host[4:]
        with self.db.get_connection() as conn:
            conn.execute("""
            INSERT INTO watched_sites (display_name, hostname, daily_limit_min, is_enabled)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(hostname) DO UPDATE SET
                display_name=excluded.display_name,
                daily_limit_min=excluded.daily_limit_min,
                is_enabled=excluded.is_enabled;
            """, (display_name.strip(), clean_host, daily_limit_min, is_enabled))
            conn.commit()

    def delete_watched_site(self, site_id: int):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM watched_sites WHERE id = ?;", (site_id,))
            conn.commit()

    def toggle_watched_site(self, site_id: int, is_enabled: bool):
        with self.db.get_connection() as conn:
            conn.execute("UPDATE watched_sites SET is_enabled = ? WHERE id = ?;", (1 if is_enabled else 0, site_id))
            conn.commit()

    def get_today_site_usage_sec(self, hostname: str) -> int:
        clean_host = hostname.lower().strip()
        today_str = date.today().strftime("%Y-%m-%d")
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT SUM(duration_sec) as total_sec FROM activities
            WHERE start_time >= ? AND is_idle = 0 AND (domain = ? OR domain LIKE ?);
            """, (f"{today_str} 00:00:00", clean_host, f"%.{clean_host}"))
            row = cursor.fetchone()
            return (row["total_sec"] or 0) if row else 0

    # --- SITE EXCLUSIONS (NEVER TRACK) ---
    def get_site_exclusions(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM site_exclusions ORDER BY hostname ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def add_site_exclusion(self, hostname: str, notes: str = "") -> bool:
        clean_host = hostname.lower().strip().replace("http://", "").replace("https://", "").split("/")[0]
        if clean_host.startswith("www."):
            clean_host = clean_host[4:]
        if not clean_host or "." not in clean_host:
            return False
        with self.db.get_connection() as conn:
            conn.execute("INSERT OR IGNORE INTO site_exclusions (hostname, notes) VALUES (?, ?);", (clean_host, notes))
            conn.commit()
            return True

    def delete_site_exclusion(self, exclusion_id: int):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM site_exclusions WHERE id = ?;", (exclusion_id,))
            conn.commit()

    def is_site_excluded(self, hostname: str) -> bool:
        if not hostname:
            return False
        clean_host = hostname.lower().strip()
        exclusions = self.get_site_exclusions()
        for ex in exclusions:
            ex_host = ex["hostname"]
            if clean_host == ex_host or clean_host.endswith("." + ex_host):
                return True
        return False

    # --- TIMERS AND ALARMS ---
    def get_custom_timers(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM custom_timers ORDER BY id ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def add_custom_timer(self, name: str, mode: str = "interval", interval_min: int = 30,
                         target_time: str = "17:00", notification_type: str = "toast", is_enabled: int = 1) -> int:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO custom_timers (name, mode, interval_min, target_time, notification_type, is_enabled)
            VALUES (?, ?, ?, ?, ?, ?);
            """, (name.strip(), mode, interval_min, target_time, notification_type, is_enabled))
            conn.commit()
            return cursor.lastrowid

    def update_custom_timer(self, timer_id: int, name: str, mode: str, interval_min: int,
                            target_time: str, notification_type: str, is_enabled: int):
        with self.db.get_connection() as conn:
            conn.execute("""
            UPDATE custom_timers SET
                name = ?, mode = ?, interval_min = ?, target_time = ?,
                notification_type = ?, is_enabled = ?
            WHERE id = ?;
            """, (name.strip(), mode, interval_min, target_time, notification_type, is_enabled, timer_id))
            conn.commit()

    def delete_custom_timer(self, timer_id: int):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM custom_timers WHERE id = ?;", (timer_id,))
            conn.commit()

    def toggle_custom_timer(self, timer_id: int, is_enabled: bool):
        with self.db.get_connection() as conn:
            conn.execute("UPDATE custom_timers SET is_enabled = ? WHERE id = ?;", (1 if is_enabled else 0, timer_id))
            conn.commit()

    # --- CUSTOM TIMERS & ALARMS ---
    def get_custom_timers(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM custom_timers ORDER BY id ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def add_custom_timer(self, name: str, mode: str, interval_min: int, target_time: str,
                         notification_type: str = "toast", is_enabled: int = 1) -> int:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO custom_timers (name, mode, interval_min, target_time, notification_type, is_enabled)
            VALUES (?, ?, ?, ?, ?, ?);
            """, (name.strip(), mode, interval_min, target_time.strip(), notification_type, is_enabled))
            conn.commit()
            return cursor.lastrowid

    def update_custom_timer(self, timer_id: int, name: str, mode: str, interval_min: int,
                            target_time: str, notification_type: str = "toast", is_enabled: int = 1):
        with self.db.get_connection() as conn:
            conn.execute("""
            UPDATE custom_timers SET
                name = ?, mode = ?, interval_min = ?, target_time = ?,
                notification_type = ?, is_enabled = ?
            WHERE id = ?;
            """, (name.strip(), mode, interval_min, target_time.strip(), notification_type, is_enabled, timer_id))
            conn.commit()

    def set_custom_timer_enabled(self, timer_id: int, is_enabled: bool):
        with self.db.get_connection() as conn:
            conn.execute("UPDATE custom_timers SET is_enabled = ? WHERE id = ?;", (1 if is_enabled else 0, timer_id))
            conn.commit()

    def delete_custom_timer(self, timer_id: int):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM custom_timers WHERE id = ?;", (timer_id,))
            conn.commit()

    def update_custom_timer_triggered(self, timer_id: int, timestamp: Optional[datetime] = None):
        ts = (timestamp or datetime.now()).strftime("%Y-%m-%d %H:%M:%S")
        with self.db.get_connection() as conn:
            conn.execute("UPDATE custom_timers SET last_triggered = ? WHERE id = ?;", (ts, timer_id))
            conn.commit()

    # --- WATCHED WEBSITES ---
    def get_watched_sites(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM watched_sites ORDER BY hostname ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def add_or_update_watched_site(self, display_name: str, hostname: str, daily_limit_min: int, is_enabled: int = 1):
        host_clean = hostname.lower().strip().replace("http://", "").replace("https://", "").split("/")[0].replace("www.", "")
        with self.db.get_connection() as conn:
            conn.execute("""
            INSERT INTO watched_sites (display_name, hostname, daily_limit_min, is_enabled)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(hostname) DO UPDATE SET
                display_name = excluded.display_name,
                daily_limit_min = excluded.daily_limit_min,
                is_enabled = excluded.is_enabled;
            """, (display_name.strip() or host_clean, host_clean, daily_limit_min, is_enabled))
            conn.commit()

    def set_watched_site_enabled(self, site_id: int, is_enabled: bool):
        with self.db.get_connection() as conn:
            conn.execute("UPDATE watched_sites SET is_enabled = ? WHERE id = ?;", (1 if is_enabled else 0, site_id))
            conn.commit()

    def delete_watched_site(self, site_id: int):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM watched_sites WHERE id = ?;", (site_id,))
            conn.commit()

    def get_today_domain_usage_sec(self, hostname: str) -> int:
        """Returns total active seconds recorded today for a specific hostname or subdomain."""
        today_str = date.today().strftime("%Y-%m-%d")
        host_clean = hostname.lower().strip()
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT SUM(duration_sec) as total_sec
            FROM activities
            WHERE start_time >= ? AND is_idle = 0 AND (
                lower(domain) = ? OR lower(domain) LIKE ?
            );
            """, (f"{today_str} 00:00:00", host_clean, f"%.{host_clean}"))
            row = cursor.fetchone()
            return row["total_sec"] or 0

    # --- SITE EXCLUSIONS (NEVER TRACK) ---
    def get_excluded_sites(self) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM site_exclusions ORDER BY hostname ASC;")
            return [dict(row) for row in cursor.fetchall()]

    def add_excluded_site(self, hostname: str, notes: str = ""):
        host_clean = hostname.lower().strip().replace("http://", "").replace("https://", "").split("/")[0].replace("www.", "")
        with self.db.get_connection() as conn:
            conn.execute("INSERT OR IGNORE INTO site_exclusions (hostname, notes) VALUES (?, ?);", (host_clean, notes))
            conn.commit()

    def delete_excluded_site(self, exclusion_id: int):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM site_exclusions WHERE id = ?;", (exclusion_id,))
            conn.commit()

    def is_site_excluded(self, domain: str) -> bool:
        if not domain:
            return False
        d = domain.lower().strip()
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT hostname FROM site_exclusions;")
            for row in cursor.fetchall():
                ex = row["hostname"].lower().strip()
                if d == ex or d.endswith("." + ex):
                    return True
        return False

    # --- DATA MANAGEMENT & PRIVACY ---
    def clear_activity_history(self):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM activities;")
            conn.execute("DELETE FROM interventions;")
            conn.execute("DELETE FROM intent_sessions;")
            conn.commit()

    def reset_settings_to_default(self):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM settings;")
            conn.commit()
        # re-init
        self.db._init_schema()
