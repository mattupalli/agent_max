from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agent import run_ai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/agent")
def agent_invoke(input: str):
    response = run_ai(input)
    return {"response": response}
