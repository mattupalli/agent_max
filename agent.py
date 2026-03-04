from dotenv import load_dotenv
import os
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.tools import tool
from typing import Literal
from tavily import TavilyClient

load_dotenv()

# ---- TOOL ----
@tool
def internet_search(
    query: str,
    max_results: int = 5,
    # topic: Literal["Finance"] = "Finance",
    include_raw_content: bool = False,
) -> list[dict]:
    """Run a web search via Tavily and return JSON results."""
    tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    return tavily_client.search(
        query,
        max_results=max_results,
        include_raw_content=include_raw_content,
    )

llm = ChatOpenAI(
    model="qwen/qwen3-vl-30b-a3b-thinking",
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPEN_ROUTER_API_KEY"),
)


agent = create_agent(
    model=llm,
    # tools=[internet_search],
    system_prompt=("You are a intelligent assistant. You're name is agent max")
#     system_prompt = (
#     """You are an intelligent AI assistant that answers questions accurately and clearly.

#     Follow these steps:
#     1. Try to answer using your existing knowledge first.
#     2. If the information is missing, uncertain, or outdated, use the internet_search tool.
#     3. Always return results in English.
#     4. If the source is in another language, translate it to English before responding.
#     5. Keep responses clear, concise, and helpful."""
# )
)

def run_ai(user_input: str)-> str:
    result = agent.invoke(
        {"messages": [{"role": "user", "content": user_input}]},
    )
    messages = result.get("messages", [])
    for m in messages:
        if m.__class__.__name__ == "AIMessage":
            return (str(m.content).strip())