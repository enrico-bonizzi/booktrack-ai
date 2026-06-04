from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BookImage(Base):
    __tablename__ = "book_images"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"), index=True, nullable=False
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    book = relationship("Book", back_populates="images")
