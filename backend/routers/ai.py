from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from routers.timetable import get_current_user
from models import User
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import PyPDF2
import os
import io
import json

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path)

router = APIRouter(prefix="/ai", tags=["AI"])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class QuizRequest(BaseModel):
    text: str


@router.post("/simplify-notes")
def simplify_notes(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        pdf_bytes = file.file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))

        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text() + "\n"

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF")

        prompt = f"""You are an expert academic tutor. A student has uploaded study material from a PDF. Read the text below and create simplified notes.

Text from PDF:
{extracted_text[:8000]}

Respond ONLY with valid JSON in exactly this format, nothing else, no markdown backticks:
{{
  "key_points": ["point 1", "point 2", "point 3"],
  "formulas": ["formula 1", "formula 2"],
  "important_questions": ["question 1", "question 2", "question 3"]
}}

If there are no formulas in this material, return an empty list for formulas. Keep key_points to 5-8 items and important_questions to 3-5 items."""

        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
        )

        ai_text = response.text.strip()
        ai_text = ai_text.replace("```json", "").replace("```", "").strip()

        result = json.loads(ai_text)
        return result

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI response could not be processed. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wrong: {str(e)}")


@router.post("/generate-quiz")
def generate_quiz(
    request: QuizRequest,
    current_user: User = Depends(get_current_user),
):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Please provide some notes text")

    try:
        prompt = f"""You are an expert academic tutor. Based on the notes below, create exactly 5 multiple choice questions to test understanding.

Notes:
{request.text[:6000]}

Respond ONLY with valid JSON in exactly this format, nothing else, no markdown backticks:
[
  {{
    "question": "question text here",
    "options": {{"A": "option text", "B": "option text", "C": "option text", "D": "option text"}},
    "correct_answer": "A"
  }}
]

Create exactly 5 questions. Make sure correct_answer is always one of "A", "B", "C", or "D"."""

        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
        )

        ai_text = response.text.strip()
        ai_text = ai_text.replace("```json", "").replace("```", "").strip()

        result = json.loads(ai_text)
        return result

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI response could not be processed. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wrong: {str(e)}")