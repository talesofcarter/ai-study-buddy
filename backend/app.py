from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import json
import re
from transformers import pipeline
import torch
import time

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configure logging with detailed format (Windows-compatible)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)

# Set console to handle UTF-8 on Windows
import sys

if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "ai_study_buddy"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "charset": "utf8mb4",
    "collation": "utf8mb4_unicode_ci",
}

# Hugging Face configuration - Use better models for quality output
QUESTION_MODEL_NAME = os.getenv("QUESTION_MODEL_NAME", "google/flan-t5-base")
ANSWER_MODEL_NAME = os.getenv("ANSWER_MODEL_NAME", "google/flan-t5-base")
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")  # Optional: for private models


class FlashcardGenerator:
    def __init__(self):
        self.question_generator = None
        self.answer_generator = None
        self.models_initialized = False
        self._initialize_models()

    def _initialize_models(self):
        """Initialize the Hugging Face models for question and answer generation"""
        try:
            logger.info("INIT: Starting Hugging Face model initialization...")

            # Check device availability
            device = 0 if torch.cuda.is_available() else -1
            device_name = "GPU" if torch.cuda.is_available() else "CPU"
            logger.info(f"DEVICE: Using device: {device_name}")

            # Initialize question generation model
            logger.info(
                f"MODEL: Loading question generation model: {QUESTION_MODEL_NAME}"
            )
            self.question_generator = pipeline(
                "text2text-generation",
                model=QUESTION_MODEL_NAME,
                device=device,
                max_length=512,
                do_sample=True,
                temperature=0.7,
            )
            logger.info("SUCCESS: Question generation model loaded successfully")

            # Initialize answer generation model
            logger.info(f"MODEL: Loading answer generation model: {ANSWER_MODEL_NAME}")
            self.answer_generator = pipeline(
                "text2text-generation",
                model=ANSWER_MODEL_NAME,
                device=device,
                max_length=512,
                do_sample=True,
                temperature=0.3,
            )
            logger.info("SUCCESS: Answer generation model loaded successfully")

            self.models_initialized = True
            logger.info("COMPLETE: Model initialization completed!")

        except Exception as e:
            logger.error(f"CRITICAL: Error initializing Hugging Face models: {str(e)}")
            self.question_generator = None
            self.answer_generator = None
            self.models_initialized = False
            raise Exception(f"Failed to initialize Hugging Face models: {str(e)}")

    def generate_questions_from_context(self, text, subjects=None, num_questions=5):
        """Generate flashcards using ONLY Hugging Face models - no fallbacks"""
        try:
            logger.info(
                f"START: Starting flashcard generation for {num_questions} questions"
            )
            logger.info(f"INPUT: Input text length: {len(text)} characters")
            logger.info(f"SUBJECTS: {subjects if subjects else ['general']}")

            # Check if models are initialized
            if (
                not self.models_initialized
                or not self.question_generator
                or not self.answer_generator
            ):
                error_msg = "Hugging Face models are not properly initialized. Cannot generate flashcards."
                logger.error(f"MODEL_ERROR: {error_msg}")
                raise Exception(error_msg)

            # Clean and prepare the text
            cleaned_text = self._clean_text(text)
            logger.info("CLEAN: Text cleaned and prepared for processing")

            # Split text into chunks for better processing
            text_chunks = self._split_text_into_chunks(cleaned_text)
            logger.info(f"CHUNKS: Text split into {len(text_chunks)} chunks")

            flashcards = []
            successful_generations = 0
            failed_generations = 0

            for i in range(num_questions):
                try:
                    logger.info(
                        f"GENERATE: Generating flashcard {i+1}/{num_questions} using LLM..."
                    )

                    # Select appropriate text chunk
                    chunk_index = i % len(text_chunks)
                    current_chunk = text_chunks[chunk_index]

                    # Generate question using LLM ONLY
                    question = self._generate_question_with_llm(current_chunk, subjects)
                    if not question:
                        raise Exception("LLM failed to generate question")

                    logger.info(f"QUESTION: Generated by LLM: '{question[:50]}...'")

                    # Generate answer using LLM ONLY
                    answer = self._generate_answer_with_llm(current_chunk, question)
                    if not answer:
                        raise Exception("LLM failed to generate answer")

                    logger.info(f"ANSWER: Generated by LLM: '{answer[:50]}...'")

                    # Generate explanation using LLM ONLY
                    explanation = self._generate_explanation_with_llm(
                        current_chunk, question, answer
                    )
                    if not explanation:
                        explanation = "No explanation could be generated by the model."

                    logger.info("EXPLANATION: Generated by LLM successfully")

                    # Create flashcard
                    flashcard = {
                        "id": int(datetime.now().timestamp() * 1000) + i,
                        "question": question,
                        "answer": answer,
                        "explanation": explanation,
                        "tags": subjects if subjects else ["general"],
                        "difficulty": self._determine_difficulty_with_llm(
                            question, answer
                        ),
                        "bookmarked": False,
                        "lastReviewed": None,
                        "reviewCount": 0,
                        "mastery": 0,
                        "createdAt": datetime.now().isoformat(),
                    }

                    flashcards.append(flashcard)
                    successful_generations += 1
                    logger.info(
                        f"SUCCESS: Flashcard {i+1} created successfully using LLM!"
                    )

                except Exception as e:
                    failed_generations += 1
                    logger.error(
                        f"LLM_ERROR: Error generating flashcard {i+1} with LLM: {str(e)}"
                    )
                    continue

            if successful_generations == 0:
                error_msg = f"LLM failed to generate any flashcards. All {failed_generations} attempts failed. Please check your models and try again."
                logger.error(f"COMPLETE_FAILURE: {error_msg}")
                raise Exception(error_msg)

            logger.info(
                f"COMPLETE: Flashcard generation completed! Successfully created {successful_generations}/{num_questions} flashcards using LLM"
            )
            return flashcards

        except Exception as e:
            logger.error(
                f"CRITICAL: Critical error in generate_questions_from_context: {str(e)}"
            )
            raise

    def _generate_question_with_llm(self, context, subjects=None):
        """Generate question using FLAN-T5 model with proper prompting"""
        try:
            if not self.question_generator:
                raise Exception("Question generation model not available")

            # Better prompt format for FLAN-T5
            subject_context = f" about {', '.join(subjects)}" if subjects else ""
            prompt = f"Create a study question{subject_context} based on this text: {context[:400]}"

            logger.info(f"LLM_REQUEST: Sending question generation request to model")

            result = self.question_generator(
                prompt,
                max_new_tokens=60,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.question_generator.tokenizer.eos_token_id,
            )

            if not result or not result[0] or "generated_text" not in result[0]:
                raise Exception(
                    "Model returned invalid response for question generation"
                )

            question = result[0]["generated_text"].strip()
            question = self._clean_generated_text(question)

            if not question or len(question.strip()) < 10:
                raise Exception("Model generated empty or too short question")

            # Ensure proper question format
            if not question.endswith("?"):
                question += "?"

            # Remove any prompt remnants
            if prompt.lower() in question.lower():
                question = question.replace(prompt, "").strip()

            logger.info(f"LLM_SUCCESS: Question generated successfully")
            return question

        except Exception as e:
            logger.error(f"LLM_QUESTION_ERROR: {str(e)}")
            raise Exception(f"Question generation failed: {str(e)}")

    def _generate_answer_with_llm(self, context, question):
        """Generate answer using FLAN-T5 model with proper prompting"""
        try:
            if not self.answer_generator:
                raise Exception("Answer generation model not available")

            # Better prompt format for FLAN-T5
            prompt = f"Answer this question: {question}\n\nBased on this information: {context[:400]}"

            logger.info(f"LLM_REQUEST: Sending answer generation request to model")

            result = self.answer_generator(
                prompt,
                max_new_tokens=120,
                num_return_sequences=1,
                temperature=0.5,
                do_sample=True,
                pad_token_id=self.answer_generator.tokenizer.eos_token_id,
            )

            if not result or not result[0] or "generated_text" not in result[0]:
                raise Exception("Model returned invalid response for answer generation")

            answer = result[0]["generated_text"].strip()
            answer = self._clean_generated_text(answer)

            # Remove prompt if it appears in answer
            if prompt.lower() in answer.lower():
                answer = answer.replace(prompt, "").strip()

            if not answer or len(answer.strip()) < 10:
                raise Exception("Model generated empty or too short answer")

            logger.info(f"LLM_SUCCESS: Answer generated successfully")
            return answer

        except Exception as e:
            logger.error(f"LLM_ANSWER_ERROR: {str(e)}")
            raise Exception(f"Answer generation failed: {str(e)}")

    def _generate_explanation_with_llm(self, context, question, answer):
        """Generate explanation using FLAN-T5 model with proper prompting"""
        try:
            if not self.answer_generator:
                raise Exception("Explanation generation model not available")

            # Better prompt format for explanations
            prompt = f"Explain why this answer is correct: Question: {question} Answer: {answer} Context: {context[:200]}"

            logger.info(f"LLM_REQUEST: Sending explanation generation request to model")

            result = self.answer_generator(
                prompt,
                max_new_tokens=100,
                num_return_sequences=1,
                temperature=0.4,
                do_sample=True,
                pad_token_id=self.answer_generator.tokenizer.eos_token_id,
            )

            if not result or not result[0] or "generated_text" not in result[0]:
                raise Exception(
                    "Model returned invalid response for explanation generation"
                )

            explanation = result[0]["generated_text"].strip()
            explanation = self._clean_generated_text(explanation)

            # Remove prompt if it appears in explanation
            if prompt.lower() in explanation.lower():
                explanation = explanation.replace(prompt, "").strip()

            if not explanation or len(explanation.strip()) < 15:
                raise Exception("Model generated empty or too short explanation")

            logger.info(f"LLM_SUCCESS: Explanation generated successfully")
            return explanation

        except Exception as e:
            logger.error(f"LLM_EXPLANATION_ERROR: {str(e)}")
            # For explanations, we can return a generic message if LLM fails
            return "Additional context and explanation could not be generated by the model."

    def _determine_difficulty_with_llm(self, question, answer):
        """Determine difficulty using LLM analysis"""
        try:
            if not self.answer_generator:
                return "medium"  # Default fallback

            prompt = f"rate difficulty as easy, medium, or hard: question: {question} answer: {answer}"

            result = self.answer_generator(
                prompt,
                max_new_tokens=10,
                num_return_sequences=1,
                pad_token_id=self.answer_generator.tokenizer.eos_token_id,
            )

            if result and result[0] and "generated_text" in result[0]:
                difficulty = (
                    result[0]["generated_text"].replace(prompt, "").strip().lower()
                )
                if difficulty in ["easy", "medium", "hard"]:
                    return difficulty

            # Fallback to length-based analysis if LLM fails
            combined_length = len(question.split()) + len(answer.split())
            if combined_length < 15:
                return "easy"
            elif combined_length < 30:
                return "medium"
            else:
                return "hard"

        except Exception as e:
            logger.error(f"DIFFICULTY_ERROR: {str(e)}")
            return "medium"

    def _clean_text(self, text):
        """Clean and normalize the input text"""
        logger.info("CLEAN: Cleaning input text...")
        text = " ".join(text.split())
        text = re.sub(r"[^\w\s.,!?;:()\-]", "", text)
        logger.info("SUCCESS: Text cleaning completed")
        return text

    def _clean_generated_text(self, text):
        """Clean generated text from models"""
        # Remove common prompt indicators
        text = re.sub(
            r"^(Question:|Answer:|Explanation:|question:|answer:|explanation:|Create a study question|Answer this question|Explain why)",
            "",
            text,
        ).strip()
        text = re.sub(r"\n+", " ", text)
        text = re.sub(r"\s+", " ", text)

        # Remove repetitive phrases that T5 sometimes generates
        words = text.split()
        if len(words) > 10:
            # Check for repetitive patterns and truncate
            unique_phrases = []
            current_phrase = []
            for word in words:
                if len(current_phrase) < 8:
                    current_phrase.append(word)
                else:
                    phrase = " ".join(current_phrase)
                    if phrase not in unique_phrases:
                        unique_phrases.append(phrase)
                    current_phrase = [word]

            if unique_phrases:
                text = " ".join(unique_phrases)
                if current_phrase:
                    text += " " + " ".join(current_phrase)

        return text.strip()

    def _split_text_into_chunks(self, text, max_chunk_size=1000):
        """Split text into manageable chunks for processing"""
        sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) < max_chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks if chunks else [text[:max_chunk_size]]


class DatabaseManager:
    def __init__(self):
        self.connection = None

    def get_connection(self):
        """Get database connection"""
        try:
            if self.connection is None or not self.connection.is_connected():
                self.connection = mysql.connector.connect(**DB_CONFIG)
                logger.info("DB: Database connection established")
            return self.connection
        except Error as e:
            logger.error(f"ERROR: Error connecting to MySQL: {e}")
            raise

    def create_tables(self):
        """Create necessary database tables"""
        try:
            logger.info("DB: Creating database tables...")
            connection = self.get_connection()
            cursor = connection.cursor()
            create_flashcards_table = """
            CREATE TABLE IF NOT EXISTS flashcards (
                id BIGINT PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                explanation TEXT,
                tags JSON,
                difficulty ENUM('easy', 'medium', 'hard', 'neutral') DEFAULT 'medium',
                bookmarked BOOLEAN DEFAULT FALSE,
                last_reviewed TIMESTAMP NULL,
                review_count INT DEFAULT 0,
                mastery INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """
            cursor.execute(create_flashcards_table)
            connection.commit()
            logger.info("SUCCESS: Database tables created successfully")
        except Error as e:
            logger.error(f"ERROR: Error creating tables: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def save_flashcards(self, flashcards):
        """Save flashcards to database"""
        try:
            logger.info(f"SAVE: Saving {len(flashcards)} flashcards to database...")
            connection = self.get_connection()
            cursor = connection.cursor()
            insert_query = """
            INSERT INTO flashcards (id, question, answer, explanation, tags, difficulty, 
                                  bookmarked, last_reviewed, review_count, mastery, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            question = VALUES(question),
            answer = VALUES(answer),
            explanation = VALUES(explanation),
            tags = VALUES(tags),
            updated_at = CURRENT_TIMESTAMP
            """
            for card in flashcards:
                cursor.execute(
                    insert_query,
                    (
                        card["id"],
                        card["question"],
                        card["answer"],
                        card.get("explanation", ""),
                        json.dumps(card["tags"]),
                        card["difficulty"],
                        card["bookmarked"],
                        card.get("lastReviewed"),
                        card["reviewCount"],
                        card["mastery"],
                        card["createdAt"],
                    ),
                )
            connection.commit()
            logger.info(
                f"SUCCESS: Successfully saved {len(flashcards)} flashcards to database"
            )
        except Error as e:
            logger.error(f"ERROR: Error saving flashcards: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def get_all_flashcards(self):
        """Retrieve all flashcards from database"""
        try:
            logger.info("FETCH: Retrieving all flashcards from database...")
            connection = self.get_connection()
            cursor = connection.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT id, question, answer, explanation, tags, difficulty, 
                       bookmarked, last_reviewed as lastReviewed, 
                       review_count as reviewCount, mastery, 
                       created_at as createdAt, updated_at as updatedAt
                FROM flashcards 
                ORDER BY created_at DESC
                """
            )
            flashcards = cursor.fetchall()
            for card in flashcards:
                if card["tags"]:
                    card["tags"] = json.loads(card["tags"])
                else:
                    card["tags"] = ["general"]
                if card["createdAt"]:
                    card["createdAt"] = card["createdAt"].isoformat()
                if card["updatedAt"]:
                    card["updatedAt"] = card["updatedAt"].isoformat()
                if card["lastReviewed"]:
                    card["lastReviewed"] = card["lastReviewed"].isoformat()

            logger.info(f"SUCCESS: Successfully retrieved {len(flashcards)} flashcards")
            return flashcards
        except Error as e:
            logger.error(f"ERROR: Error retrieving flashcards: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def update_flashcard(self, card_id, updates):
        """Update a specific flashcard"""
        try:
            logger.info(f"UPDATE: Updating flashcard {card_id}...")
            connection = self.get_connection()
            cursor = connection.cursor()
            update_fields = []
            values = []
            for field, value in updates.items():
                if field == "tags":
                    update_fields.append("tags = %s")
                    values.append(json.dumps(value))
                else:
                    update_fields.append(f"{field} = %s")
                    values.append(value)
            if update_fields:
                query = f"UPDATE flashcards SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s"
                values.append(card_id)
                cursor.execute(query, values)
                connection.commit()
                logger.info(f"SUCCESS: Successfully updated flashcard {card_id}")
        except Error as e:
            logger.error(f"ERROR: Error updating flashcard: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def delete_flashcards(self, card_ids):
        """Delete multiple flashcards"""
        try:
            logger.info(f"DELETE: Deleting {len(card_ids)} flashcards...")
            connection = self.get_connection()
            cursor = connection.cursor()
            placeholders = ", ".join(["%s"] * len(card_ids))
            query = f"DELETE FROM flashcards WHERE id IN ({placeholders})"
            cursor.execute(query, card_ids)
            connection.commit()
            logger.info(f"SUCCESS: Successfully deleted {len(card_ids)} flashcards")
        except Error as e:
            logger.error(f"ERROR: Error deleting flashcards: {e}")
            raise
        finally:
            if cursor:
                cursor.close()


# Initialize components
logger.info("INIT: Initializing application components...")
try:
    db_manager = DatabaseManager()
    flashcard_generator = FlashcardGenerator()

    # Initialize database
    db_manager.create_tables()
    logger.info("SUCCESS: Application initialized successfully")
except Exception as e:
    logger.error(f"ERROR: Failed to initialize application: {str(e)}")
    # Don't raise here, let the app start but handle errors in endpoints


# API Routes
@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    logger.info("HEALTH: Health check requested")

    # Check if models are initialized
    models_status = {
        "models_initialized": getattr(flashcard_generator, "models_initialized", False),
        "question_model": flashcard_generator.question_generator is not None,
        "answer_model": flashcard_generator.answer_generator is not None,
    }

    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "models": models_status,
        }
    )


@app.route("/api/generate", methods=["POST"])
def generate_flashcards():
    """Generate flashcards from study notes using Hugging Face models ONLY"""
    try:
        logger.info("REQUEST: Flashcard generation request received")

        data = request.get_json()
        if not data or "text" not in data:
            logger.warning("WARNING: No text provided in request")
            return jsonify({"error": "No text provided"}), 400

        text = data["text"]
        subjects = data.get("subjects", [])

        logger.info(
            f"DATA: Request details - Text length: {len(text)}, Subjects: {subjects}"
        )

        if len(text.strip()) < 50:
            logger.warning("WARNING: Text too short for processing")
            return jsonify({"error": "Text must be at least 50 characters long"}), 400

        # Check if models are properly initialized
        if (
            not hasattr(flashcard_generator, "models_initialized")
            or not flashcard_generator.models_initialized
        ):
            error_msg = "Hugging Face models are not initialized. Cannot process your request. Please check server logs and restart the application."
            logger.error(f"MODEL_ERROR: {error_msg}")
            return jsonify({"error": error_msg}), 503

        logger.info("MODEL: Starting flashcard generation using LLM models only...")

        flashcards = flashcard_generator.generate_questions_from_context(
            text, subjects, num_questions=5
        )

        if not flashcards:
            error_msg = "The LLM models failed to generate any flashcards from your text. Please try different content or check if the models are working properly."
            logger.error(f"LLM_FAILURE: {error_msg}")
            return jsonify({"error": error_msg}), 400

        logger.info("SAVE: Saving LLM-generated flashcards to database...")
        db_manager.save_flashcards(flashcards)

        logger.info(
            f"COMPLETE: Successfully generated and saved {len(flashcards)} flashcards using LLM!"
        )

        return jsonify(
            {
                "flashcards": flashcards,
                "count": len(flashcards),
                "message": f"Successfully generated {len(flashcards)} flashcards using Hugging Face models",
            }
        )

    except Exception as e:
        error_msg = f"LLM processing failed: {str(e)}"
        logger.error(f"CRITICAL: {error_msg}")
        return (
            jsonify(
                {
                    "error": error_msg,
                    "details": "The Hugging Face models encountered an error while processing your text. Please try again or check if the models are properly configured.",
                }
            ),
            500,
        )


@app.route("/api/flashcards", methods=["GET"])
def get_flashcards():
    """Get all flashcards"""
    try:
        logger.info("FETCH: Fetching all flashcards...")
        flashcards = db_manager.get_all_flashcards()
        return jsonify(flashcards)
    except Exception as e:
        logger.error(f"ERROR: Error in get_flashcards: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/flashcards/<int:card_id>", methods=["PUT"])
def update_flashcard(card_id):
    """Update a specific flashcard"""
    try:
        logger.info(f"UPDATE: Update request for flashcard {card_id}")
        data = request.get_json()
        if not data:
            return jsonify({"error": "No update data provided"}), 400
        allowed_fields = [
            "question",
            "answer",
            "explanation",
            "tags",
            "difficulty",
            "bookmarked",
            "lastReviewed",
            "reviewCount",
            "mastery",
        ]
        updates = {k: v for k, v in data.items() if k in allowed_fields}
        if not updates:
            return jsonify({"error": "No valid update fields provided"}), 400
        db_manager.update_flashcard(card_id, updates)
        return jsonify({"message": "Flashcard updated successfully"})
    except Exception as e:
        logger.error(f"ERROR: Error in update_flashcard: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/flashcards", methods=["DELETE"])
def delete_flashcards():
    """Delete multiple flashcards"""
    try:
        logger.info("DELETE: Delete request received")
        data = request.get_json()
        if not data or "ids" not in data or not data["ids"]:
            return jsonify({"error": "No flashcard IDs provided"}), 400
        card_ids = data["ids"]
        db_manager.delete_flashcards(card_ids)
        return jsonify({"message": f"Deleted {len(card_ids)} flashcards successfully"})
    except Exception as e:
        logger.error(f"ERROR: Error in delete_flashcards: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    logger.warning(f"WARNING: 404 error: {request.url}")
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"ERROR: 500 error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    logger.info("START: Starting Flask application...")
    app.run(debug=True, host="0.0.0.0", port=5000)
