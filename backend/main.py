from fastapi import FastAPI, Request, HTTPException
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI()
client = OpenAI()

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (adjust for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set your OpenAI API key from the environment variable
client.api_key = os.getenv("OPENAI_API_KEY")

@app.post("/generate_diagram")
async def generate_diagram(request: Request):
    data = await request.json()
    description = data.get("description")
    diagram_type = data.get("diagram_type")

    # Mapping to handle common diagram types and provide better guidance to OpenAI
    diagram_type_prompts = {
        "classDiagram": "a class diagram with classes, attributes, methods, and relationships",
        "sequenceDiagram": "a sequence diagram illustrating interaction between objects",
        "flowchart": "a flowchart to represent process flow",
        "useCase": "a use case diagram to represent actors and use cases",
        "stateDiagram": "a state diagram to represent state transitions",
        "activityDiagram": "an activity diagram showing actions and transitions",
        "componentDiagram": "a component diagram illustrating system components",
        "deploymentDiagram": "a deployment diagram showing the hardware and software nodes",
        "objectDiagram": "an object diagram representing instances of classes and their relationships",
        "packageDiagram": "a package diagram showing grouped elements and relationships"
    }

    # Use predefined prompts or default to a generic description
    specific_prompt = diagram_type_prompts.get(diagram_type, "a UML diagram")

    # Generate Mermaid code based on the selected diagram type and description
    prompt = f"Generate {specific_prompt} using Mermaid.js for this description: {description}"

    try:
        # Call OpenAI API to generate Mermaid code
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )

        # Extract the generated Mermaid code
        mermaid_code = response.choices[0].message.content.strip()

        # Process the Mermaid code:
        # 1. Remove the "```mermaid" and "```" markers
        # 2. Remove colons from the start and end of lines
        # 3. Remove leading and trailing spaces
        mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()

        # Split lines and strip colons and spaces
        cleaned_lines = []
        for line in mermaid_code.splitlines():
            # Remove colons at the start and end of the line
            cleaned_line = line.strip().lstrip(':').rstrip(':').strip()
            if cleaned_line:  # Only add non-empty lines
                cleaned_lines.append(cleaned_line)

        # Join cleaned lines back into a single string
        final_mermaid_code = "\n".join(cleaned_lines)

        # Return the cleaned Mermaid code as a response
        return {"mermaid_code": final_mermaid_code}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
