"""
Distraction detection and intervention rule engine.
Handles:
- Reminders global suppression & pause deadlines
- Watched website daily limits & continuous usage
- Short-form video (Shorts / Reels / TikTok) session limits & daily budget
- Video pausing trigger
- Full-screen lockdown vs gentle notification preference
- Additional time / snooze configuration
- Important activity exemption deadlines
"""

import time
from datetime import datetime
from typing import Optional, Callable, Dict, Any
from focus_companion.app.database.repository import Repository
from focus_companion.app.core.focus_engine import FocusEngine


class InterventionManager:
    def __init__(self, repository: Repository, focus_engine: FocusEngine):
        self.repo = repository
        self.focus_engine = focus_engine

        # Cooldown management
        self._last_intervention_time: float = 0.0
        self._cooldown_seconds: float = 120.0
        self._snooze_until: float = 0.0

        # Continuous tracking for distracting apps/sites
        self._distraction_start_time: Optional[float] = None
        self._last_distraction_source: str = ""

        # Continuous short-form video tracking (YouTube Shorts, TikTok, Instagram Reels)
        self._shorts_start_time: Optional[float] = None
        self._last_shorts_time: float = 0.0

        # UI Callback for displaying intervention overlay or notification
        self.on_intervention: Optional[Callable[[Dict[str, Any]], None]] = None

    def are_interventions_suppressed(self) -> bool:
        """Checks if distraction interventions are paused globally, timed out, or exempted."""
        # 1. Reminders global switch
        if self.repo.get_setting("reminders_enabled", "true").lower() != "true":
            return True

        now_dt = datetime.now()
        # 2. Check temporary pause deadline
        paused_until = self.repo.get_setting("reminders_paused_until", "")
        if paused_until:
            try:
                deadline = datetime.strptime(paused_until, "%Y-%m-%d %H:%M:%S")
                if now_dt < deadline:
                    return True
                else:
                    self.repo.set_setting("reminders_paused_until", "")
            except Exception:
                pass

        # 3. Check important activity exemption deadline
        exemption_until = self.repo.get_setting("important_exemption_until", "")
        if exemption_until:
            try:
                deadline = datetime.strptime(exemption_until, "%Y-%m-%d %H:%M:%S")
                if now_dt < deadline:
                    return True
                else:
                    self.repo.set_setting("important_exemption_until", "")
            except Exception:
                pass

        return False

    def is_paused(self) -> bool:
        paused_until = self.repo.get_setting("reminders_paused_until", "")
        if not paused_until:
            return False
        try:
            deadline = datetime.strptime(paused_until, "%Y-%m-%d %H:%M:%S")
            return datetime.now() < deadline
        except Exception:
            return False

    def is_exempt(self) -> bool:
        exemption_until = self.repo.get_setting("important_exemption_until", "")
        if not exemption_until:
            return False
        try:
            deadline = datetime.strptime(exemption_until, "%Y-%m-%d %H:%M:%S")
            return datetime.now() < deadline
        except Exception:
            return False

    def set_pause_reminders(self, minutes: int):
        from datetime import timedelta
        deadline = datetime.now() + timedelta(minutes=minutes)
        self.repo.set_setting("reminders_paused_until", deadline.strftime("%Y-%m-%d %H:%M:%S"))

    def cancel_pause_reminders(self):
        self.repo.set_setting("reminders_paused_until", "")

    def set_important_exemption(self, minutes: int = 30):
        from datetime import timedelta
        deadline = datetime.now() + timedelta(minutes=minutes)
        self.repo.set_setting("important_exemption_until", deadline.strftime("%Y-%m-%d %H:%M:%S"))

    def cancel_important_exemption(self):
        self.repo.set_setting("important_exemption_until", "")

    def evaluate_activity(self, app_name: str, domain: str, classification: int, is_idle: bool):
        now = time.time()
        if is_idle or now < self._snooze_until:
            self._distraction_start_time = None
            return

        if self.are_interventions_suppressed():
            return

        source = domain if domain else app_name
        is_distraction = (classification == -1)

        # 1. Check Watched Sites Daily Limits
        if domain:
            self._evaluate_watched_site_limits(domain)

        # 2. Check Shorts / Short-form video limits
        if domain in ("tiktok.com", "instagram.com") or (domain == "youtube.com"):
            self._evaluate_shorts_limits(domain)

        # 3. Check if in focus session
        if self.focus_engine.is_active and not self.focus_engine.is_on_break:
            profile = self.focus_engine.profile_data or {}
            restricted_domains = [d.strip().lower() for d in profile.get("restricted_domains", "").split(",") if d.strip()]

            # Check domain restriction in active focus profile
            if domain and any(domain.lower() == rd or domain.lower().endswith("." + rd) for rd in restricted_domains):
                is_distraction = True

            if is_distraction:
                if self._last_distraction_source != source or self._distraction_start_time is None:
                    self._distraction_start_time = now
                    self._last_distraction_source = source

                distracted_for = now - self._distraction_start_time
                default_th = int(self.repo.get_setting("distraction_threshold_sec", "45"))
                threshold = profile.get("distraction_threshold_sec", default_th)
                cooldown_sec = float(self.repo.get_setting("intervention_cooldown_sec", str(self._cooldown_seconds)))

                if distracted_for >= threshold and (now - self._last_intervention_time) >= cooldown_sec:
                    style = profile.get("intervention_style", "reminder")
                    if self.repo.get_setting("strict_focus_mode", "false").lower() == "true":
                        style = "strict"
                    self._trigger_intervention(
                        source=source,
                        level=style,
                        reason=f"Restricted during '{self.focus_engine.profile_name}' focus session ({int(distracted_for)}s active)."
                    )
                return

        # 4. General distraction check outside focus session (Continuous limit)
        if is_distraction:
            if self._last_distraction_source != source or self._distraction_start_time is None:
                self._distraction_start_time = now
                self._last_distraction_source = source

            distracted_for = now - self._distraction_start_time
            _, _, _, cont_lim_min, _ = self.repo.match_rule(app_name, domain)
            cont_limit_sec = (cont_lim_min * 60) if cont_lim_min > 0 else 600  # default 10m

            cooldown_sec = float(self.repo.get_setting("intervention_cooldown_sec", str(self._cooldown_seconds)))
            if distracted_for >= cont_limit_sec and (now - self._last_intervention_time) >= cooldown_sec:
                self._trigger_intervention(
                    source=source,
                    level="nudge",
                    reason=f"You've been on {source} continuously for {int(distracted_for // 60)} minutes."
                )
        else:
            self._distraction_start_time = None

    def _evaluate_watched_site_limits(self, domain: str):
        """Checks if active domain has an enabled watched site rule with daily limit exceeded."""
        now = time.time()
        cooldown_sec = float(self.repo.get_setting("intervention_cooldown_sec", str(self._cooldown_seconds)))
        if (now - self._last_intervention_time) < cooldown_sec:
            return

        watched_sites = self.repo.get_watched_sites()
        clean_domain = domain.lower().strip()
        for site in watched_sites:
            if not site["is_enabled"]:
                continue
            host = site["hostname"].lower().strip()
            if clean_domain == host or clean_domain.endswith("." + host):
                limit_min = site["daily_limit_min"]
                if limit_min > 0:
                    used_sec = self.repo.get_today_site_usage_sec(host)
                    if used_sec >= (limit_min * 60):
                        self._trigger_intervention(
                            source=site["display_name"],
                            level="strict" if self.repo.get_setting("fullscreen_lockdown_enabled", "false").lower() == "true" else "reminder",
                            reason=f"Daily watched limit of {limit_min}m reached for {site['display_name']} ({int(used_sec // 60)}m used today)."
                        )
                break

    def _evaluate_shorts_limits(self, domain: str):
        """Tracks continuous & daily short-form video consumption."""
        now = time.time()
        cooldown_sec = float(self.repo.get_setting("intervention_cooldown_sec", str(self._cooldown_seconds)))

        # Reset interval check
        reset_interval_sec = int(self.repo.get_setting("shorts_session_reset_interval_min", "5")) * 60
        if self._last_shorts_time and (now - self._last_shorts_time) > reset_interval_sec:
            self._shorts_start_time = None

        self._last_shorts_time = now
        if self._shorts_start_time is None:
            self._shorts_start_time = now

        shorts_duration = now - self._shorts_start_time
        cont_limit_min = int(self.repo.get_setting("shorts_continuous_limit_min", "10"))

        if (now - self._last_intervention_time) >= cooldown_sec:
            if cont_limit_min == 0 or shorts_duration >= (cont_limit_min * 60):
                self._trigger_intervention(
                    source="Short-form Video (" + domain + ")",
                    level="strict" if self.repo.get_setting("fullscreen_lockdown_enabled", "false").lower() == "true" else "reminder",
                    reason=f"Continuous short-form video limit of {cont_limit_min}m reached."
                )

    def _trigger_intervention(self, source: str, level: str, reason: str):
        now = time.time()
        self._last_intervention_time = now
        self.focus_engine.record_distraction()

        # Check lockdown countdown
        countdown_sec = int(self.repo.get_setting("lockdown_countdown_sec", "15"))
        is_fullscreen = self.repo.get_setting("fullscreen_lockdown_enabled", "false").lower() == "true"
        pause_video = self.repo.get_setting("pause_video_enabled", "false").lower() == "true"

        event = {
            "source": source,
            "level": level,
            "reason": reason,
            "session_id": self.focus_engine.session_id,
            "is_fullscreen": is_fullscreen,
            "countdown_sec": countdown_sec,
            "pause_video": pause_video
        }

        self.repo.log_intervention(
            session_id=self.focus_engine.session_id,
            trigger_source=source,
            intervention_level=level,
            action_taken="triggered"
        )

        if self.on_intervention:
            self.on_intervention(event)

    def handle_user_action(self, action: str, source: str):
        """
        User action handlers:
        - 'return': back to work immediately
        - 'snooze': snooze for configured snooze_duration_min
        - 'break': start a 5m break
        - 'continue': grant temporary extra time
        - 'important': set important activity exemption deadline
        """
        now = time.time()
        snooze_min = int(self.repo.get_setting("snooze_duration_min", "5"))

        if action == "snooze":
            self._snooze_until = now + (snooze_min * 60)
        elif action == "break":
            self.focus_engine.start_break(5)
        elif action == "continue":
            self._snooze_until = now + 600  # 10 minutes continue
        elif action == "important":
            # Exemption deadline for 60 minutes
            exemption_deadline = datetime.fromtimestamp(now + 3600).strftime("%Y-%m-%d %H:%M:%S")
            self.repo.set_setting("important_exemption_until", exemption_deadline)
            self._snooze_until = now + 3600

        self.repo.log_intervention(
            session_id=self.focus_engine.session_id,
            trigger_source=source,
            intervention_level="action",
            action_taken=action
        )
