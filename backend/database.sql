-- Create database
CREATE DATABASE IF NOT EXISTS ai_study_buddy CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ai_study_buddy;

-- Create flashcards table
CREATE TABLE
    IF NOT EXISTS flashcards (
        id BIGINT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        explanation TEXT,
        tags JSON,
        difficulty ENUM ('easy', 'medium', 'hard', 'neutral') DEFAULT 'medium',
        bookmarked BOOLEAN DEFAULT FALSE,
        last_reviewed TIMESTAMP NULL,
        review_count INT DEFAULT 0,
        mastery INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_difficulty (difficulty),
        INDEX idx_bookmarked (bookmarked),
        INDEX idx_tags (tags (255))
    );

-- Create study sessions table (for future use)
CREATE TABLE
    IF NOT EXISTS study_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_name VARCHAR(255),
        flashcard_ids JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

-- Create user progress table (for future use)
CREATE TABLE
    IF NOT EXISTS user_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        total_reviewed INT DEFAULT 0,
        studied_today INT DEFAULT 0,
        mastery_level DECIMAL(5, 2) DEFAULT 0.00,
        current_streak INT DEFAULT 0,
        last_study_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );