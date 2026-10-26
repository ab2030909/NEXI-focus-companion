"""
Focus engine for managing focus sessions, pomodoro countdowns, break states,
distraction counter, and session persistence.
"""

from datetime import datetime
from typing import Optional, Callable, Dict, Any
from focus_companion.app.database.repository import Repository


class FocusEngine:
    def __init__(self, repository: Repository):
        self.repo = repository

        self.session_id: Optional[int] = None
        self.session_name: str = "Focus Sprint"
        self.profile_name: str = "Deep Work"
        self.profile_data: Optional[Dict[str, Any]] = None

        self.planned_duration_sec: int = 25 * 60
        self.remaining_sec: int = 25 * 60
        self.elapsed_sec: int = 0
        self.distraction_count: int = 0

        self.is_active: bool = False
        self.is_paused: bool = False
        self.is_on_break: bool = False
        self.break_remaining_sec: int = 5 * 60

        # Intent Mode Session State
        self.intent_id: Optional[int] = None
        self.intent_domain: str = ""
        self.intent_note: str = ""
        self.intent_budget_sec: int = 0
        self.intent_remaining_sec: int = 0
        self.intent_elapsed_sec: int = 0
        self.intent_active: bool = False
        self.intent_paused: bool = False

        # Intent UI Callbacks
        self.on_intent_tick: Optional[Callable[[int, int, str], None]] = None  # remaining_sec, elapsed_sec, note
        self.on_intent_state_changed: Optional[Callable[[str, Optional[Dict[str, Any]]], None]] = None  # state ('idle', 'active', 'paused', 'completed'), intent_data
        self.on_intent_completed: Optional[Callable[[Dict[str, Any]], None]] = None

        # Check and restore any persisted active intent on launch
        self._restore_active_intent()

    def _restore_active_intent(self):
        active_intent = self.repo.get_active_intent()
        if active_intent:
            self.intent_id = active_intent["id"]
            self.intent_domain = active_intent.get("domain", "")
            self.intent_note = active_intent.get("intent_note", "")
            budget_min = active_intent.get("budget_minutes", 15)
            self.intent_budget_sec = budget_min * 60

            # Calculate elapsed time based on start_time
            try:
                start_dt = datetime.strptime(active_intent["start_time"], "%Y-%m-%d %H:%M:%S")
                diff_sec = int((datetime.now() - start_dt).total_seconds())
                if diff_sec >= self.intent_budget_sec:
                    # Session expired while app was closed -> close it cleanly
                    self.repo.close_intent_session(self.intent_id, status="completed")
                    self.intent_active = False
                    self.intent_id = None
                    return
                else:
                    self.intent_elapsed_sec = max(0, diff_sec)
                    self.intent_remaining_sec = max(0, self.intent_budget_sec - self.intent_elapsed_sec)
            except Exception:
                self.intent_elapsed_sec = 0
                self.intent_remaining_sec = self.intent_budget_sec

            if active_intent.get("status") == "paused":
                self.intent_active = True
                self.intent_paused = True
            else:
                self.intent_active = True
                self.intent_paused = False

    def start_intent_session(self, note: str, budget_min: int, domain: str = "") -> int:
        """Starts a new intent session with validated task objective and time budget."""
        if budget_min <= 0:
            budget_min = 15
        note_clean = note.strip() or "Focused Intent"
        domain_clean = domain.strip().lower()

        # End any current intent session cleanly before starting a new one
        if self.intent_active and self.intent_id:
            self.repo.close_intent_session(self.intent_id, status="cancelled")

        self.intent_domain = domain_clean
        self.intent_note = note_clean
        self.intent_budget_sec = budget_min * 60
        self.intent_remaining_sec = self.intent_budget_sec
        self.intent_elapsed_sec = 0
        self.intent_active = True
        self.intent_paused = False

        self.intent_id = self.repo.create_intent_session(
            domain=domain_clean,
            note=note_clean,
            budget_min=budget_min
        )

        if self.on_intent_state_changed:
            self.on_intent_state_changed("active", self.get_active_intent_data())

        return self.intent_id

    def pause_intent_session(self):
        if self.intent_active and not self.intent_paused:
            self.intent_paused = True
            if self.intent_id:
                self.repo.update_intent_status(self.intent_id, "paused")
            if self.on_intent_state_changed:
                self.on_intent_state_changed("paused", self.get_active_intent_data())

    def resume_intent_session(self):
        if self.intent_active and self.intent_paused:
            self.intent_paused = False
            if self.intent_id:
                self.repo.update_intent_status(self.intent_id, "active")
            if self.on_intent_state_changed:
                self.on_intent_state_changed("active", self.get_active_intent_data())

    def cancel_intent_session(self):
        if self.intent_active:
            if self.intent_id:
                self.repo.close_intent_session(self.intent_id, status="cancelled")
            self.intent_active = False
            self.intent_paused = False
            self.intent_id = None
            if self.on_intent_state_changed:
                self.on_intent_state_changed("idle", None)

    def get_active_intent_data(self) -> Optional[Dict[str, Any]]:
        if not self.intent_active:
            return None
        return {
            "id": self.intent_id,
            "note": self.intent_note,
            "domain": self.intent_domain,
            "budget_min": self.intent_budget_sec // 60,
            "remaining_sec": self.intent_remaining_sec,
            "elapsed_sec": self.intent_elapsed_sec,
            "is_paused": self.intent_paused
        }

    def start_session(self, profile_name: str = "Deep Work", duration_min: int = 25, name: str = "Focus Sprint") -> int:
        self.profile_name = profile_name
        self.profile_data = self.repo.get_profile_by_name(profile_name) or {}
        self.session_name = name
        self.planned_duration_sec = duration_min * 60
        self.remaining_sec = self.planned_duration_sec
        self.elapsed_sec = 0
        self.distraction_count = 0
        self.is_active = True
        self.is_paused = False
        self.is_on_break = False

        self.session_id = self.repo.create_focus_session(
            name=self.session_name,
            profile_name=self.profile_name,
            planned_duration_min=duration_min
        )
        return self.session_id

    def pause_session(self):
        if self.is_active:
            self.is_paused = True

    def resume_session(self):
        if self.is_active:
            self.is_paused = False

    def end_session_early(self):
        if not self.is_active:
            return
        self.is_active = False
        if self.session_id:
            self.repo.update_focus_session(
                session_id=self.session_id,
                actual_duration_sec=self.elapsed_sec,
                completed=False,
                notes="Ended early by user",
                distraction_count=self.distraction_count
            )
            self.session_id = None

    def tick_second(self):
        """Called every second by the timer."""
        # 1. Tick Intent Mode Countdown if active and not paused
        if self.intent_active and not self.intent_paused:
            if self.intent_remaining_sec > 1:
                self.intent_remaining_sec -= 1
                self.intent_elapsed_sec += 1
                if self.on_intent_tick:
                    self.on_intent_tick(self.intent_remaining_sec, self.intent_elapsed_sec, self.intent_note)
            else:
                self.intent_remaining_sec = 0
                self.intent_elapsed_sec += 1
                self._complete_intent_session()

        # 2. Tick Regular Focus Session
        if not self.is_active or self.is_paused:
            return

        if self.is_on_break:
            if self.break_remaining_sec > 0:
                self.break_remaining_sec -= 1
            else:
                self.is_on_break = False
                if self.on_break_completed:
                    self.on_break_completed()
            if self.on_second_tick:
                self.on_second_tick(self.break_remaining_sec, self.elapsed_sec, True)
            return

        # Regular focus time
        if self.remaining_sec > 0:
            self.remaining_sec -= 1
            self.elapsed_sec += 1
            if self.on_second_tick:
                self.on_second_tick(self.remaining_sec, self.elapsed_sec, False)
        else:
            self._complete_session()

    def _complete_intent_session(self):
        self.intent_active = False
        self.intent_paused = False
        summary = {
            "id": self.intent_id,
            "note": self.intent_note,
            "domain": self.intent_domain,
            "budget_min": self.intent_budget_sec // 60,
            "elapsed_sec": self.intent_elapsed_sec
        }
        if self.intent_id:
            self.repo.close_intent_session(self.intent_id, status="completed")
            self.intent_id = None

        if self.on_intent_state_changed:
            self.on_intent_state_changed("completed", summary)
        if self.on_intent_completed:
            self.on_intent_completed(summary)

    def _complete_session(self):
        self.is_active = False
        summary = {
            "session_id": self.session_id,
            "name": self.session_name,
            "profile": self.profile_name,
            "planned_min": self.planned_duration_sec // 60,
            "actual_sec": self.elapsed_sec,
            "distraction_count": self.distraction_count
        }
        if self.session_id:
            self.repo.update_focus_session(
                session_id=self.session_id,
                actual_duration_sec=self.elapsed_sec,
                completed=True,
                notes="Successfully completed session",
                distraction_count=self.distraction_count
            )
        if self.on_session_completed:
            self.on_session_completed(summary)

    def start_break(self, break_min: int = 5):
        self.is_on_break = True
        self.break_remaining_sec = break_min * 60

    def record_distraction(self):
        self.distraction_count += 1

