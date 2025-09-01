CREATE DATABASE flashcards_db;

CREATE TABLE
    flashcards (
        id BIGSERIAL NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        explanation TEXT,
        tags JSONB,
        difficulty VARCHAR(20) DEFAULT 'neutral',
        createdAt TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            bookmarked BOOLEAN DEFAULT FALSE,
            reviewCount INT DEFAULT 0,
            lastReviewed TIMESTAMP
        WITH
            TIME ZONE,
            PRIMARY KEY (id)
    );