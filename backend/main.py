from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, subjects

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Academic OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(subjects.router, tags=["Subjects & Topics"])

@app.get("/")
def root():
    return {"message": "Academic OS backend is running!"}