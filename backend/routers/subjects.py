from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Subject, Topic
from auth import decode_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user_id(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    return int(payload["sub"])

# --- Subject Models ---
class SubjectRequest(BaseModel):
    name: str

# --- Topic Models ---
class TopicRequest(BaseModel):
    name: str
    subject_id: int

# --- Subject Routes ---
@router.get("/subjects")
def get_subjects(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
    return subjects

@router.post("/subjects")
def create_subject(data: SubjectRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    subject = Subject(name=data.name, user_id=user_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted"}

# --- Topic Routes ---
@router.get("/subjects/{subject_id}/topics")
def get_topics(subject_id: int, db: Session = Depends(get_db)):
    topics = db.query(Topic).filter(Topic.subject_id == subject_id).all()
    return topics

@router.post("/topics")
def create_topic(data: TopicRequest, db: Session = Depends(get_db)):
    topic = Topic(name=data.name, subject_id=data.subject_id)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

@router.patch("/topics/{topic_id}/complete")
def mark_complete(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    topic.is_complete = True
    db.commit()
    return {"message": "Topic marked complete"}

@router.delete("/topics/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()
    return {"message": "Topic deleted"}