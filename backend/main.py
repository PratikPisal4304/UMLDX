from fastapi import FastAPI, Request, HTTPException
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI()

# Initialize OpenAI Client properly
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (adjust for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mapping for different diagram types
diagram_prompts = {
    "classDiagram": "a class diagram with classes, attributes, methods, and relationships",
    "sequenceDiagram": "a sequence diagram showing object interactions over time",
    "flowchart": "a flowchart to represent process flow",
    "useCase": "a use case diagram illustrating actors and use cases",
    "stateDiagram": "a state diagram displaying state transitions",
    "activityDiagram": "an activity diagram representing workflows",
    "componentDiagram": "a component diagram showing software architecture",
    "deploymentDiagram": "a deployment diagram for system hardware/software",
    "objectDiagram": "an object diagram showing class instances",
    "packageDiagram": "a package diagram illustrating dependencies",
}

# Cache to store the last generated diagram
cache = {"mermaid_code": None}  # Store only the last generated diagram

@app.post("/generate_diagram")
async def generate_diagram(request: Request):
    data = await request.json()
    description = data.get("description")
    diagram_type = data.get("diagram_type", "classDiagram")

    prompt = f"Modify the following Mermaid.js diagram based on this new description: {description}.\n\n"
    
    # If a previous diagram exists, pass it as context
    if cache["mermaid_code"]:
        prompt += f"Existing Diagram:\n{cache['mermaid_code']}"

    else:
        # If there's no previous diagram, generate a new one
        prompt = f"Generate {diagram_prompts.get(diagram_type, 'a UML diagram')} using Mermaid.js. The description is: {description}."

    try:
        # Call OpenAI API to modify or generate a new diagram
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )

        if not response.choices:
            raise HTTPException(status_code=500, detail="No response from OpenAI.")

        # Extract and clean the Mermaid code
        mermaid_code = response.choices[0].message.content.strip()
        mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()

        # Update the cache with the modified diagram
        cache["mermaid_code"] = mermaid_code

        return {"mermaid_code": mermaid_code}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
