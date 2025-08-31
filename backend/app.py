import os
import requests
import json
import datetime
import uuid
import re

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

HUGGING_FACE_API_TOKEN = os.getenv("HUGGING_FACE_API_TOKEN")
# UPDATED: We now point to the standardized Chat Completions API endpoint.
API_URL = "https://router.huggingface.co/v1/chat/completions"
MODEL_ID = "openai/gpt-oss-120b:together"


# --- Helper Functions ---

def query_huggingface(text_notes: str) -> dict | None:
    """
    Sends the user's notes to the Hugging Face Chat Completions API.
    """
    if not HUGGING_FACE_API_TOKEN:
        raise ValueError("Hugging Face API token is not set in the .env file.")

    # UPDATED: The payload is now structured with a 'messages' array.
    # This is the standard for modern chat-based language models.
    headers = {
        "Authorization": f"Bearer {HUGGING_FACE_API_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful study assistant. Your task is to generate flashcards from the provided text. Output *only* a valid JSON array of objects, with no other text or explanations."
            },
            {
                "role": "user",
                "content": f"""
Based on the following text, generate exactly 5 distinct flashcards.
Each flashcard object in the array must have three string keys: "question", "answer", and "explanation".
- The "question" should be a clear, concise query about a key concept from the text.
- The "answer" should directly and accurately respond to the question based *only* on the provided text.
- The "explanation" should provide a bit more context or detail about the answer, also based on the text.

Text:
\"\"\"
{text_notes}
\"\"\"
"""
            }
        ],
        "max_tokens": 1500,
        "temperature": 0.6,
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API: {e}")
        return None

def clean_and_parse_json(llm_output_text: str) -> list | None:
    """
    Cleans the raw text from the LLM to extract and parse the JSON array.
    """
    match = re.search(r'\[.*\]', llm_output_text, re.DOTALL)
    if match:
        json_str = match.group(0)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error after cleaning: {e}")
            print(f"Attempted to parse: {json_str}")
            return None
    else:
        print("No JSON array found in the LLM output.")
        return None


# --- API Routes ---

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is healthy"}), 200


@app.route('/api/generate', methods=['POST'])
def generate_flashcards():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    notes = data.get('text')
    subjects = data.get('subjects', [])

    if not notes or len(notes.strip()) < 100:
        return jsonify({"error": "Text content is missing or too short"}), 400

    if not subjects:
        return jsonify({"error": "At least one subject must be selected"}), 400

    api_response = query_huggingface(notes)
    if not api_response:
        return jsonify({"error": "Failed to get response from generation service. The model may be loading or unavailable."}), 503

    # UPDATED: The response structure is different for the Chat Completions API.
    # We now access the content from the 'choices' array.
    try:
        generated_text = api_response['choices'][0]['message']['content']
    except (KeyError, IndexError):
        print(f"Failed to extract content from API response: {api_response}")
        return jsonify({"error": "Generation service returned an unexpected response format"}), 500

    if not generated_text:
        return jsonify({"error": "Generation service returned an empty response"}), 500

    parsed_cards = clean_and_parse_json(generated_text)
    if not parsed_cards or not isinstance(parsed_cards, list):
        print(f"Failed to parse LLM output: {generated_text}")
        return jsonify({"error": "Could not parse the generated flashcards. Please try again."}), 500

    formatted_flashcards = []
    for card in parsed_cards:
        if not all(k in card for k in ['question', 'answer', 'explanation']):
            continue

        formatted_flashcards.append({
            "id": uuid.uuid4().int & (1 << 32) - 1,
            "question": str(card['question']),
            "answer": str(card['answer']),
            "explanation": str(card.get('explanation', '')),
            "tags": subjects,
            "difficulty": "neutral",
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "bookmarked": False,
            "reviewCount": 0,
            "lastReviewed": None,
        })

    if not formatted_flashcards:
        return jsonify({"error": "The model generated data in an unexpected format. Please try again."}), 500

    return jsonify({"flashcards": formatted_flashcards})


# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)