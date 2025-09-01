CREATE DATABASE flashcards_db;

USE flashcards_db;

CREATE TABLE
    IF NOT EXISTS flashcards (
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
    ) DEFAULT CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT
    id,
    question,
    answer,
    explanation,
    bookMarked,
    difficulty
FROM
    flashcards;