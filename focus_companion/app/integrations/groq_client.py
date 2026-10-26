"""
Optional Groq AI integration.
- Strictly requires GROQ_API_KEY and explicit user consent.
- Never sends full URLs, keystrokes, personal details, or raw activity logs.
- Sends only minimal aggregated numerical summaries.
- Completely optional: the desktop app works 100% offline without it.
"""

import os
from typing import Optional, Dict, Any


class GroqCoach:
    def __init__(self, api_key: str = "", model: str = "openai/gpt-oss-120b"):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self.model = model or os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

    def is_configured(self) -> bool:
        return bool(self.api_key.strip())

    def generate_weekly_insights(self, summary_metrics: Dict[str, Any]) -> str:
        """
        Generates a concise, supportive focus analysis from aggregated weekly totals.
        """
        if not self.is_configured():
            return "Groq API key not configured. Enter your key in Settings > Privacy to enable AI insights."

        try:
            from groq import Groq
            client = Groq(api_key=self.api_key.strip())

            prompt = f"""
You are a thoughtful, pragmatic productivity companion.
Analyze this user's weekly summarized computer usage (in minutes) and provide 3 brief, actionable insights:
- Total Active Time: {summary_metrics.get('active_min', 0)} mins
- Productive Work: {summary_metrics.get('productive_min', 0)} mins
- Distracting Usage: {summary_metrics.get('distracting_min', 0)} mins
- Focus Sessions Completed: {summary_metrics.get('focus_sessions_count', 0)}
- Top Productive Apps: {summary_metrics.get('top_apps', 'N/A')}
- Top Distractions: {summary_metrics.get('top_distractions', 'N/A')}

Keep tone supportive, minimalist, and constructive. No corporate jargon. Max 150 words.
"""
            completion = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a minimalist, supportive digital habits companion."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=300
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            return f"Unable to reach Groq AI: {str(e)}"

    def suggest_focus_plan(self, daily_goal_min: int, top_distraction: str) -> str:
        if not self.is_configured():
            return "Please provide a Groq API key in Settings."
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key.strip())
            prompt = f"""
User's target daily focus goal is {daily_goal_min} minutes.
Their primary recorded distraction is {top_distraction}.
Suggest a concise 3-step focus sprint schedule (e.g. Pomodoro intervals with specific buffer blocks) to hit this goal sustainably.
Max 100 words.
"""
            completion = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=250
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            return f"Error connecting to AI coach: {str(e)}"
