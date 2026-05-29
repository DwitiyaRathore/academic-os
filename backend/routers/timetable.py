from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import TimetableSlot, User
from auth import decode_token
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta

router = APIRouter(prefix="/timetable", tags=["Timetable"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

class SubjectInput(BaseModel):
    name: str
    exam_date: str
    priority: str

class TimetableRequest(BaseModel):
    subjects: List[SubjectInput]
    hours_per_day: int

@router.post("/generate")
def generate_timetable(data: TimetableRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(TimetableSlot).filter(TimetableSlot.user_id == current_user.id).delete()
    db.commit()

    today = datetime.today()
    slots = []

    subject_days = []
    for subject in data.subjects:
        exam_date = datetime.strptime(subject.exam_date, "%Y-%m-%d")
        days_left = (exam_date - today).days
        if days_left <= 0:
            days_left = 1
        weight = 3 if subject.priority == "high" else 2 if subject.priority == "medium" else 1
        subject_days.append({
            "name": subject.name,
            "days_left": days_left,
            "weight": weight,
            "hours_assigned": 0
        })

    total_weight = sum(s["weight"] for s in subject_days)
    max_days = max(s["days_left"] for s in subject_days)

    for day_offset in range(max_days):
        current_date = today + timedelta(days=day_offset)
        date_str = current_date.strftime("%Y-%m-%d")
        remaining_hours = data.hours_per_day

        available = [s for s in subject_days if s["days_left"] > day_offset]
        if not available:
            break

        day_weight = sum(s["weight"] for s in available)

        for subject in available:
            hours = round((subject["weight"] / day_weight) * remaining_hours)
            if hours < 1:
                hours = 1
            slot = TimetableSlot(
                user_id=current_user.id,
                date=date_str,
                subject_name=subject["name"],
                hours=hours
            )
            db.add(slot)
            slots.append({"date": date_str, "subject": subject["name"], "hours": hours})

    db.commit()
    return {"message": "Timetable generated successfully", "plan": slots}

@router.get("/")
def get_timetable(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    slots = db.query(TimetableSlot).filter(TimetableSlot.user_id == current_user.id).all()
    return [{"date": s.date, "subject": s.subject_name, "hours": s.hours} for s in slots]