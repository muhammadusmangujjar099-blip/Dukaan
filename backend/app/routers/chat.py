from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ChatRequest, ChatResponse
from ..services.ai import handle_chat

router = APIRouter(tags=["assistant"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    return handle_chat(db, req)
