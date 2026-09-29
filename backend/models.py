from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SurveySession(Base):
    __tablename__ = "survey_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    prototype_opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    prototype_returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("survey_sessions.id"), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    prototype_opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    prototype_returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completion_time_seconds: Mapped[float] = mapped_column(Float)
    participant_name: Mapped[str] = mapped_column(String(200))
    major_program: Mapped[str] = mapped_column(String(200))
    college_school: Mapped[str] = mapped_column(String(200))
    initial_product_testing_interest: Mapped[str | None] = mapped_column(String(40), nullable=True)
    usc_affiliation: Mapped[str] = mapped_column(String(100))
    fitness_interests: Mapped[list] = mapped_column(JSON)
    fitness_interests_other: Mapped[str | None] = mapped_column(Text)
    participation_barriers: Mapped[list] = mapped_column(JSON)
    participation_barriers_other: Mapped[str | None] = mapped_column(Text)
    most_valuable_feature: Mapped[str] = mapped_column(String(200))
    likely_action: Mapped[str] = mapped_column(String(200))
    adoption_barriers: Mapped[list] = mapped_column(JSON)
    next_month_likelihood: Mapped[str] = mapped_column(String(100))
    overall_reaction: Mapped[str | None] = mapped_column(Text)