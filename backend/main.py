from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import google.generativeai as genai
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure API key
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("No Google API key found in environment variables")
    genai.configure(api_key=api_key)
except Exception as e:
    logger.error(f"API Key Configuration Error: {e}")
    raise

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_available_model():
    """
    Discover and return the most appropriate generative model with robust error handling
    """
    try:
        # List available models, filtering out deprecated or experimental models
        all_models = genai.list_models()
        models = [
            m.name for m in all_models 
            if 'generateContent' in m.supported_generation_methods 
            and 'exp' not in m.name.lower()  # Exclude experimental models
            and 'deprecated' not in m.name.lower()
        ]
        
        logger.info(f"Available models: {models}")

        # Updated priority list with newer, stable models
        priority_models = [
            'models/gemini-1.5-pro-latest',
            'models/gemini-1.5-pro',
            'models/gemini-1.5-flash-latest',
            'models/gemini-1.5-flash',
            'models/gemini-pro',
            'models/gemini-1.0-pro'
        ]

        # Find first available non-deprecated model
        for model_name in priority_models:
            if model_name in models:
                logger.info(f"Selected model: {model_name}")
                return model_name
        
        # If no preferred model found, select the first available stable model
        stable_models = [
            m for m in models 
            if not any(x in m.lower() for x in ['exp', 'experimental', 'preview', 'deprecated'])
        ]
        
        if stable_models:
            selected_model = stable_models[0]
            logger.info(f"Defaulting to first available stable model: {selected_model}")
            return selected_model
        
        # Last resort: raise an error if no suitable models are found
        raise ValueError("No suitable generative models found. Please check your Google AI configuration.")
    
    except Exception as e:
        logger.error(f"Model discovery error: {e}")
        # Provide a more informative error message
        if "API key" in str(e).lower():
            logger.error("Potential API key configuration issue. Please verify your GOOGLE_API_KEY.")
        raise

# Mapping for different diagram types with detailed descriptions
diagram_prompts = {
    "classDiagram": "Create a comprehensive class diagram showing detailed class structures, including class names, attributes, methods, and relationships",
    "sequenceDiagram": "Design a precise sequence diagram illustrating detailed object interactions, message exchanges, and process flow",
    "flowchart": "Generate a clear and logical flowchart representing decision points, process steps, and control flow",
    "useCase": "Develop a use case diagram showing actors, use cases, and their interactions with clear boundaries",
    "stateDiagram": "Construct a state diagram displaying complex state transitions, guard conditions, and event triggers",
    "activityDiagram": "Create an activity diagram representing workflow with swimlanes, decision points, and parallel processes",
    "componentDiagram": "Design a component diagram showing software components, their interfaces, and dependencies",
    "deploymentDiagram": "Generate a deployment diagram illustrating hardware nodes, software components, and their relationships",
    "objectDiagram": "Create an object diagram showing specific object instances and their relationships",
    "packageDiagram": "Develop a package diagram displaying package structures and dependencies"
}

# Cache to store recent diagrams
cache = {"mermaid_code": None, "description": None}

def construct_mermaid_prompt(description, diagram_type):
    """
    Create a comprehensive prompt for diagram generation
    """
    return f"""
Generate a professional {diagram_type} Mermaid.js diagram based on the following description:
{description}

Diagram Type Details: {diagram_prompts.get(diagram_type, "General UML Diagram")}

STRICT REQUIREMENTS:
1. ONLY output valid Mermaid.js syntax
2. NO explanatory text or markdown code blocks
3. Ensure technical accuracy
4. Use standard Mermaid.js conventions
5. Create a meaningful, clear diagram representing the description

If unsure about specific details, use generic but sensible defaults.
"""

@app.post("/generate_diagram")
async def generate_diagram(request: Request):
    try:
        # Parse request data
        data = await request.json()
        description = data.get("description", "").strip()
        diagram_type = data.get("diagram_type", "classDiagram")

        # Validate input
        if not description:
            raise HTTPException(status_code=400, detail="Description is required")

        # Check if request is similar to previous
        if (cache["description"] and 
            description.lower() == cache["description"].lower() and 
            cache["mermaid_code"]):
            logger.info("Returning cached diagram")
            return {"mermaid_code": cache["mermaid_code"]}

        # Dynamically select the most appropriate model
        try:
            model_name = get_available_model()
            model = genai.GenerativeModel(model_name)
        except Exception as model_error:
            logger.error(f"Model selection failed: {model_error}")
            raise HTTPException(status_code=500, detail="Unable to select a suitable AI model")

        # Construct prompt
        prompt = construct_mermaid_prompt(description, diagram_type)
        
        # Generate diagram
        generation_config = {
            'temperature': 0.3,
            'max_output_tokens': 2048,
        }
        
        logger.info(f"Generating {diagram_type} diagram using {model_name}")
        response = model.generate_content(
            prompt, 
            generation_config=generation_config
        )

        # Extract and clean Mermaid code
        mermaid_code = response.text.strip()
        mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()

        # Validate Mermaid code (basic check)
        if not mermaid_code or len(mermaid_code) < 10:
            raise ValueError("Generated diagram is too short or invalid")

        # Cache the result
        cache["mermaid_code"] = mermaid_code
        cache["description"] = description

        logger.info("Diagram generated successfully")
        return {"mermaid_code": mermaid_code}

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the full error
        logger.error(f"Diagram Generation Error: {e}")
        logger.error(traceback.format_exc())
        
        # Return a more informative error response
        return JSONResponse(
            status_code=500, 
            content={
                "error": "Failed to generate diagram",
                "details": str(e)
            }
        )

@app.post("/refresh_diagram")
async def refresh_diagram():
    """Clear the diagram cache"""
    cache["mermaid_code"] = None
    cache["description"] = None
    logger.info("Diagram cache cleared")
    return {"message": "Diagram cache reset"}

# Error handler for all unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "details": str(exc)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)