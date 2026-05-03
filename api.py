import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from google import genai

# --- Gemini Agent Setup ---
class GeminiStadiumAgent:
    def __init__(self, api_key):
        # Initialize the new genai Client
        self.client = genai.Client(api_key=api_key)
        # Use 2.5 Flash as the default standard for the new SDK
        self.model_name = 'gemini-2.5-flash'

    def analyze_global_dashboard(self, all_food_data):
        system_instruction = (
            "You are 'Stadium Brain', an advanced AI monitoring the entire stadium food ecosystem. "
            "Based on the following JSON array of all food stalls, generate a highly dynamic, "
            "urgent, 2-sentence 'Live Intelligence Briefing' for the fans. "
            "Call out long wait times to avoid, and hidden gems to grab right now."
        )
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=f"{system_instruction}\n\nData: {all_food_data}"
            )
            return response.text.strip()
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return "Stadium Brain Offline. Waiting for uplink..."

    def chat_with_fan(self, user_query, all_food_data):
        system_instruction = (
            "You are a helpful stadium food concierge AI. "
            "Answer the fan's question using ONLY the provided live food data. "
            "Keep it short, friendly, and highly actionable (under 25 words)."
        )
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=f"{system_instruction}\n\nLive Data: {all_food_data}\nFan Ask: {user_query}"
            )
            return response.text.strip()
        except Exception as e:
            return "I am currently disconnected from the main server."


# Initialize the Agent
api_key = os.getenv("GEMINI_API_KEY")
agent = GeminiStadiumAgent(api_key=api_key) if api_key else None

# --- FastAPI App Setup ---
app = FastAPI(title="StadiumBites Agentic API")

# Add CORS so our local HTML file can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class FoodItem(BaseModel):
    name: str
    vendor: str
    tasteRating: float
    hygieneRating: float
    waitTime: int

class DashboardRequest(BaseModel):
    items: List[FoodItem]

class ChatRequest(BaseModel):
    query: str
    items: List[FoodItem]

@app.post("/api/dashboard")
async def get_dashboard_insight(data: DashboardRequest):
    if not agent:
        return {"insight": "AI Alert: High congestion at Gate 4. I recommend the Spicy Paneer Wrap for fastest service and highest hygiene rating."}
    
    # Format data for LLM
    raw_data = [item.dict() for item in data.items]
    insight = agent.analyze_global_dashboard(str(raw_data))
    return {"insight": insight}

@app.post("/api/chat")
async def get_chat_response(data: ChatRequest):
    if not agent:
        return {"response": "Based on current metrics, I suggest the Pizza Slice. The wait is manageable and the rating is a solid 4.5!"}
    
    raw_data = [item.dict() for item in data.items]
    response = agent.chat_with_fan(data.query, str(raw_data))
    return {"response": response}

