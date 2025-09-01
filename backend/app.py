import os
import requests
import json
import datetime
import uuid
import re

import psycopg2
import psycopg2.pool
import psycopg2.extras

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

HUGGING_FACE_API_TOKEN = os.getenv("HUGGING_FACE_API_TOKEN")
API_URL = "https://router.huggingface.co/v1/chat/completions"
MODEL_ID = "openai/gpt-oss-120b:together"


# --- Database Configuration and Connection Pool ---
try:
    db_pool = psycopg2.pool.SimpleConnectionPool(
        1,
        20,
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
    )
except Exception as e:
    print(f"Error connecting to the database: {e}")
    db_pool = None


def setup_database():
    """Ensure the flashcards table exists."""
    connection = None
    cursor = None
    try:
        connection = db_pool.getconn()
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS flashcards (
                id SERIAL PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                explanation TEXT,
                tags JSONB,
                difficulty VARCHAR(20) DEFAULT 'neutral',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                bookmarked BOOLEAN DEFAULT FALSE,
                review_count INT DEFAULT 0,
                last_reviewed TIMESTAMP WITH TIME ZONE
            );
        """
        )
        connection.commit()
        print("Flashcards table is ready.")
    except psycopg2.Error as err:
        print(f"Error setting up database: {err}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            db_pool.putconn(connection)


# --- Helper Functions ---
def query_huggingface(text_notes: str) -> dict | None:
    if not HUGGING_FACE_API_TOKEN:
        raise ValueError("Hugging Face API token is not set in the .env file.")

    headers = {
        "Authorization": f"Bearer {HUGGING_FACE_API_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful study assistant. Your task is to generate flashcards from the provided text. Output *only* a valid JSON array of objects, with no other text or explanations.",
            },
            {
                "role": "user",
                "content": f"""
            Based on the following text, generate exactly 5 distinct flashcards.
            Each flashcard object in the array must have three string keys: "question", "answer", and "explanation".
            - The "question" should be a clear, concise query about a key concept from the text.
            - The "answer" should directly and accurately respond to the question and should not only be based on the provided text.
            - The "explanation" should provide a bit more context or detail about the answer.

            Text:
            \"\"\"
            {text_notes}
            \"\"\"
            """,
            },
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
    match = re.search(r"\[.*\]", llm_output_text, re.DOTALL)
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


def add_flashcards_to_db(cards: list) -> bool:
    connection = None
    cursor = None
    try:
        connection = db_pool.getconn()
        cursor = connection.cursor()
        query = """
            INSERT INTO flashcards (question, answer, explanation, tags, difficulty, created_at, bookmarked, review_count, last_reviewed)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = [
            (
                card["question"],
                card["answer"],
                card["explanation"],
                json.dumps(card["tags"]),
                card["difficulty"],
                card["created_at"],
                card["bookmarked"],
                card["review_count"],
                card["last_reviewed"],
            )
            for card in cards
        ]
        cursor.executemany(query, values)
        connection.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error adding flashcards to DB: {err}")
        if connection:
            connection.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if connection:
            db_pool.putconn(connection)


def get_all_flashcards_from_db() -> list:
    connection = None
    cursor = None
    flashcards = []
    try:
        connection = db_pool.getconn()
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM flashcards ORDER BY id DESC")
        for row in cursor.fetchall():
            row_dict = dict(row)
            row_dict["bookmarked"] = bool(row_dict["bookmarked"])
            row_dict["tags"] = json.loads(row_dict["tags"]) if row_dict["tags"] else []
            flashcards.append(row_dict)
    except psycopg2.Error as err:
        print(f"Error getting flashcards from DB: {err}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            db_pool.putconn(connection)
    return flashcards


def update_flashcard_in_db(card_id: int, updates: dict) -> bool:
    connection = None
    cursor = None
    try:
        connection = db_pool.getconn()
        cursor = connection.cursor()
        set_clause = ", ".join([f"{key} = %s" for key in updates.keys()])
        query = f"UPDATE flashcards SET {set_clause} WHERE id = %s"
        values = list(updates.values())
        values.append(card_id)
        cursor.execute(query, tuple(values))
        connection.commit()
        return cursor.rowcount > 0
    except psycopg2.Error as err:
        print(f"Error updating flashcard in DB: {err}")
        if connection:
            connection.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if connection:
            db_pool.putconn(connection)


def delete_flashcards_from_db(ids: list) -> bool:
    connection = None
    cursor = None
    try:
        connection = db_pool.getconn()
        cursor = connection.cursor()
        query = "DELETE FROM flashcards WHERE id IN %s"
        cursor.execute(query, (tuple(ids),))
        connection.commit()
        return cursor.rowcount > 0
    except psycopg2.Error as err:
        print(f"Error deleting flashcards from DB: {err}")
        if connection:
            connection.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if connection:
            db_pool.putconn(connection)


# --- API Routes ---
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is healthy"}), 200


@app.route("/api/generate", methods=["POST"])
def generate_flashcards():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    notes = data.get("text")
    subjects = data.get("subjects", [])
    if not notes or len(notes.strip()) < 100:
        return jsonify({"error": "Text content is missing or too short"}), 400
    if not subjects:
        return jsonify({"error": "At least one subject must be selected"}), 400
    api_response = query_huggingface(notes)
    if not api_response:
        return (
            jsonify(
                {
                    "error": "Failed to get response from generation service. The model may be loading or unavailable."
                }
            ),
            500,
        )

    generated_text = (
        api_response.get("choices", [{}])[0].get("message", {}).get("content")
    )
    if not generated_text:
        return jsonify({"error": "Failed to generate flashcards."}), 500

    parsed_cards = clean_and_parse_json(generated_text)
    if not parsed_cards or not isinstance(parsed_cards, list):
        print(f"Failed to parse LLM output: {generated_text}")
        return (
            jsonify(
                {"error": "Could not parse the generated flashcards. Please try again."}
            ),
            500,
        )

    formatted_flashcards = []
    for card in parsed_cards:
        if not all(k in card for k in ["question", "answer", "explanation"]):
            continue

        formatted_flashcards.append(
            {
                "question": str(card["question"]),
                "answer": str(card["answer"]),
                "explanation": str(card.get("explanation", "")),
                "tags": subjects,
                "difficulty": "neutral",
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "bookmarked": False,
                "review_count": 0,
                "last_reviewed": None,
            }
        )

    if not formatted_flashcards:
        return (
            jsonify(
                {
                    "error": "The model generated data in an unexpected format. Please try again."
                }
            ),
            500,
        )

    if add_flashcards_to_db(formatted_flashcards):
        return jsonify({"message": "Flashcards generated and saved successfully!"}), 201
    else:
        return (
            jsonify({"error": "Failed to save flashcards to the database."}),
            500,
        )


@app.route("/api/flashcards", methods=["GET"])
def get_flashcards():
    flashcards = get_all_flashcards_from_db()
    return jsonify(flashcards), 200


@app.route("/api/flashcards/<int:card_id>", methods=["PUT"])
def update_flashcard(card_id):
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    updates = {}
    if "question" in data:
        updates["question"] = data["question"]
    if "answer" in data:
        updates["answer"] = data["answer"]
    if "explanation" in data:
        updates["explanation"] = data["explanation"]
    if "tags" in data:
        updates["tags"] = json.dumps(data["tags"])
    if "difficulty" in data:
        updates["difficulty"] = data["difficulty"]
    if "bookmarked" in data:
        updates["bookmarked"] = data["bookmarked"]
    if "lastReviewed" in data:
        updates["last_reviewed"] = data["lastReviewed"]
    if "reviewCount" in data:
        updates["review_count"] = data["reviewCount"]

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    if update_flashcard_in_db(card_id, updates):
        return jsonify({"message": "Flashcard updated successfully"}), 200
    else:
        return jsonify({"error": "Flashcard not found or failed to update"}), 404


@app.route("/api/flashcards", methods=["DELETE"])
def delete_flashcards():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    ids_to_delete = data.get("ids")

    if not ids_to_delete or not isinstance(ids_to_delete, list):
        return jsonify({"error": "Invalid list of IDs provided"}), 400

    if delete_flashcards_from_db(ids_to_delete):
        return (
            jsonify(
                {"message": f"Deleted {len(ids_to_delete)} flashcard(s) successfully"}
            ),
            200,
        )
    else:
        return (
            jsonify(
                {
                    "error": "Failed to delete flashcard(s). Some may not have been found."
                }
            ),
            404,
        )


setup_database()


if __name__ == "__main__":
    app.run(debug=True)
