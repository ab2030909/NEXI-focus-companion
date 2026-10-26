"""
System and in-app reminder scheduler & timer alarm engine.
Supports:
- Distraction reminders global suppression check
- Reminder pause deadline check
- Important activity exemption deadline check
- Custom Timers in Interval mode (every N minutes)
- Custom Timers in Scheduled Time mode (at HH:MM local computer time)
- Missed scheduled timers recovery after sleep / restart
- Quiet hours evaluation
"""

from datetime import datetime, date, time as dtime
from typing import Optional, Callable, Dict, Any, List
from focus_companion.app.database.repository import Repository


class ReminderScheduler:
    def __init__(self, repository: Repository):
        self.repo = repository
        self._elapsed_since_check: int = 0
        self.on_reminder_triggered: Optional[Callable[[Dict[str, Any]], None]] = None
        self.on_custom_timer_triggered: Optional[Callable[[Dict[str, Any]], None]] = None

    def is_in_quiet_hours(self) -> bool:
        quiet_enabled = self.repo.get_setting("quiet_hours_enabled", "false").lower() == "true"
        if not quiet_enabled:
            return False

        try:
            start_str = self.repo.get_setting("quiet_hours_start", "22:00")
            end_str = self.repo.get_setting("quiet_hours_end", "07:00")
            s_h, s_m = map(int, start_str.split(":"))
            e_h, e_m = map(int, end_str.split(":"))

            now_time = datetime.now().time()
            start_time = dtime(s_h, s_m)
            end_time = dtime(e_h, e_m)

            if start_time < end_time:
                return start_time <= now_time <= end_time
            else: # Overnight e.g. 22:00 to 07:00
                return now_time >= start_time or now_time <= end_time
        except Exception:
            return False

    def are_reminders_paused(self) -> bool:
        """Checks if reminders are globally disabled, temporarily paused, or under an exemption deadline."""
        # 1. Global switch
        if self.repo.get_setting("reminders_enabled", "true").lower() != "true":
            return True

        now = datetime.now()
        # 2. Temporary pause deadline
        paused_until = self.repo.get_setting("reminders_paused_until", "")
        if paused_until:
            try:
                deadline = datetime.strptime(paused_until, "%Y-%m-%d %H:%M:%S")
                if now < deadline:
                    return True
                else:
                    self.repo.set_setting("reminders_paused_until", "")
            except Exception:
                pass

        # 3. Important activity exemption deadline
        exemption_until = self.repo.get_setting("important_exemption_until", "")
        if exemption_until:
            try:
                deadline = datetime.strptime(exemption_until, "%Y-%m-%d %H:%M:%S")
                if now < deadline:
                    return True
                else:
                    self.repo.set_setting("important_exemption_until", "")
            except Exception:
                pass

        return False

    def tick(self, active_duration_sec: int):
        """Called every second from tracker heartbeat."""
        self._elapsed_since_check += 1
        if self._elapsed_since_check < 5:  # Check timers every 5 seconds for responsive alarms
            return
        self._elapsed_since_check = 0

        if self.is_in_quiet_hours():
            return

        now = datetime.now()

        # 1. Evaluate custom user timers (Interval & Scheduled-Time)
        self._evaluate_custom_timers(now)

        # 2. Evaluate legacy general break reminders
        if not self.are_reminders_paused():
            self._evaluate_general_reminders(now)

    def _evaluate_custom_timers(self, now: datetime):
        timers = self.repo.get_custom_timers()
        for t in timers:
            if not t["is_enabled"]:
                continue

            last_trig = t.get("last_triggered")
            mode = t.get("mode", "interval")
            should_trigger = False

            if mode == "interval":
                interval_min = max(1, t.get("interval_min", 30))
                if not last_trig:
                    should_trigger = True
                else:
                    try:
                        last_dt = datetime.strptime(last_trig, "%Y-%m-%d %H:%M:%S")
                        diff_sec = (now - last_dt).total_seconds()
                        if diff_sec >= (interval_min * 60):
                            should_trigger = True
                    except Exception:
                        should_trigger = True

            elif mode == "scheduled":
                target_str = t.get("target_time", "17:00")
                try:
                    th, tm = map(int, target_str.split(":"))
                    target_today = datetime.combine(now.date(), dtime(th, tm))
                    # Check if target time has arrived today and hasn't triggered today
                    if now >= target_today:
                        if not last_trig:
                            should_trigger = True
                        else:
                            last_dt = datetime.strptime(last_trig, "%Y-%m-%d %H:%M:%S")
                            if last_dt.date() < now.date() or last_dt < target_today:
                                should_trigger = True
                except Exception:
                    pass

            if should_trigger:
                self.repo.update_custom_timer_triggered(t["id"])
                if self.on_custom_timer_triggered:
                    self.on_custom_timer_triggered(t)

    def _evaluate_general_reminders(self, now: datetime):
        reminders = self.repo.get_reminders()
        for rem in reminders:
            if not rem["is_enabled"]:
                continue

            last_trig = rem["last_triggered"]
            should_trigger = False

            if not last_trig:
                should_trigger = True
            else:
                try:
                    last_dt = datetime.strptime(last_trig, "%Y-%m-%d %H:%M:%S")
                    diff_min = (now - last_dt).total_seconds() / 60.0
                    if diff_min >= rem["interval_min"]:
                        should_trigger = True
                except Exception:
                    should_trigger = True

            if should_trigger:
                self.repo.update_reminder_triggered(rem["id"])
                if self.on_reminder_triggered:
                    self.on_reminder_triggered(rem)
