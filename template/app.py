import os
import requests
import json
import datetime
import uuid
import re
import mysql.connector.pooling

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
DB_CONFIG = {
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "host": os.getenv("MYSQL_HOST"),
    "database": os.getenv("MYSQL_DB"),
    "raise_on_warnings": True,
}

db_pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="db_pool", pool_size=5, **DB_CONFIG
)


def setup_database():
    """Ensure the flashcards table exists."""
    connection = None
    cursor = None
    try:
        connection = db_pool.get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS flashcards (
                id BIGINT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                explanation TEXT,
                tags JSON,
                difficulty VARCHAR(20) DEFAULT 'neutral',
                createdAt VARCHAR(50),
                bookmarked BOOLEAN DEFAULT FALSE,
                reviewCount INT DEFAULT 0,
                lastReviewed VARCHAR(50),
                PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        """
        )
        connection.commit()
        print("Flashcards table is ready.")
    except mysql.connector.Error as err:
        print(f"Error setting up database: {err}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --- Helper Functions ---


def query_huggingface(text_notes: str) -> dict | None:
    """
    Sends the user's notes to the Hugging Face Chat Completions API.
    """
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
    """
    Cleans the raw text from the LLM to extract and parse the JSON array.
    """
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
        connection = db_pool.get_connection()
        cursor = connection.cursor()
        query = "INSERT INTO flashcards (id, question, answer, explanation, tags, difficulty, createdAt, bookmarked, reviewCount, lastReviewed) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        values = [
            (
                card["id"],
                card["question"],
                card["answer"],
                card["explanation"],
                json.dumps(card["tags"]),
                card["difficulty"],
                card["createdAt"],
                card["bookmarked"],
                card["reviewCount"],
                card["lastReviewed"],
            )
            for card in cards
        ]
        cursor.executemany(query, values)
        connection.commit()
        return True
    except mysql.connector.Error as err:
        print(f"Error adding flashcards to DB: {err}")
        if connection:
            connection.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def get_all_flashcards_from_db() -> list:
    connection = None
    cursor = None
    flashcards = []
    try:
        connection = db_pool.get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM flashcards")
        for row in cursor.fetchall():
            flashcards.append(
                {
                    "id": row["id"],
                    "question": row["question"],
                    "answer": row["answer"],
                    "explanation": row["explanation"],
                    "tags": json.loads(row["tags"]),
                    "difficulty": row["difficulty"],
                    "createdAt": row["createdAt"],
                    "bookmarked": bool(row["bookmarked"]),
                    "reviewCount": row["reviewCount"],
                    "lastReviewed": row["lastReviewed"],
                }
            )
    except mysql.connector.Error as err:
        print(f"Error getting flashcards from DB: {err}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
    return flashcards


def update_flashcard_in_db(card_id: int, updates: dict) -> bool:
    connection = None
    cursor = None
    try:
        connection = db_pool.get_connection()
        cursor = connection.cursor()

        set_clause = ", ".join([f"{key} = %s" for key in updates.keys()])
        query = f"UPDATE flashcards SET {set_clause} WHERE id = %s"
        values = list(updates.values())
        values.append(card_id)

        cursor.execute(query, tuple(values))
        connection.commit()
        return cursor.rowcount > 0
    except mysql.connector.Error as err:
        print(f"Error updating flashcard in DB: {err}")
        if connection:
            connection.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def delete_flashcards_from_db(ids: list) -> bool:
    connection = None
    cursor = None
    try:
        connection = db_pool.get_connection()
        cursor = connection.cursor()

        placeholders = ", ".join(["%s"] * len(ids))
        query = f"DELETE FROM flashcards WHERE id IN ({placeholders})"

        cursor.execute(query, tuple(ids))
        connection.commit()
        return cursor.rowcount > 0
    except mysql.connector.Error as err:
        print(f"Error deleting flashcards from DB: {err}")
        if connection:
            connection.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


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
            503,
        )

    try:
        generated_text = api_response["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        print(f"Failed to extract content from API response: {api_response}")
        return (
            jsonify(
                {"error": "Generation service returned an unexpected response format"}
            ),
            500,
        )

    if not generated_text:
        return jsonify({"error": "Generation service returned an empty response"}), 500

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
                "id": uuid.uuid4().int & (1 << 32) - 1,
                "question": str(card["question"]),
                "answer": str(card["answer"]),
                "explanation": str(card.get("explanation", "")),
                "tags": subjects,
                "difficulty": "neutral",
                "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "bookmarked": False,
                "reviewCount": 0,
                "lastReviewed": None,
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

    if not add_flashcards_to_db(formatted_flashcards):
        return jsonify({"error": "Failed to save flashcards to the database."}), 500

    return jsonify({"flashcards": formatted_flashcards})


@app.route("/api/flashcards", methods=["GET"])
def get_flashcards():
    flashcards = get_all_flashcards_from_db()
    return jsonify(flashcards)


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
    if "tags" in data:
        updates["tags"] = json.dumps(data["tags"])
    if "difficulty" in data:
        updates["difficulty"] = data["difficulty"]
    if "bookmarked" in data:
        updates["bookmarked"] = data["bookmarked"]
    if "lastReviewed" in data:
        updates["lastReviewed"] = data["lastReviewed"]
    if "reviewCount" in data:
        updates["reviewCount"] = data["reviewCount"]

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
                {"message": f"Deleted {len(ids_to_delete)} flashcards successfully"}
            ),
            200,
        )
    else:
        return jsonify({"error": "Failed to delete flashcards"}), 500


# --- Main Execution ---
if __name__ == "__main__":
    setup_database()
    app.run(debug=True, port=5000)
