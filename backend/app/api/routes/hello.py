from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.message import Message

router = APIRouter(tags=["hello"])


@router.get("/hello")
def get_hello(session: Session = Depends(get_session)) -> dict:
    # Return the most recent message, seeding one the first time — proves DB read/write.
    message = session.exec(select(Message).order_by(Message.created_at.desc())).first()
    if message is None:
        message = Message(content="Hello, World!")
        session.add(message)
        session.commit()
        session.refresh(message)
    return {"message": message.content, "created_at": message.created_at.isoformat()}