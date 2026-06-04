from datetime import date, datetime
from sqlalchemy import String, Integer, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    total_pages: Mapped[int] = mapped_column(Integer, nullable=False)
    current_page: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    finish_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="books")
    images = relationship(
        "BookImage",
        back_populates="book",
        cascade="all, delete-orphan",
        order_by="BookImage.created_at.desc()",
    )
    logs = relationship(
        "ReadingLog",
        back_populates="book",
        cascade="all, delete-orphan",
        order_by="ReadingLog.logged_at.desc()",
    )
