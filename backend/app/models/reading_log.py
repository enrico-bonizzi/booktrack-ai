from datetime import datetime
from sqlalchemy import Integer, ForeignKey, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReadingLog(Base):
    __tablename__ = "reading_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"), index=True, nullable=False
    )
    pages_read: Mapped[int] = mapped_column(Integer, nullable=False)
    current_page_after: Mapped[int] = mapped_column(Integer, nullable=False)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True, nullable=False
    )

    book = relationship("Book", back_populates="logs")

    __table_args__ = (
        Index("ix_reading_logs_book_logged", "book_id", "logged_at"),
    )
