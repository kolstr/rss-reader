-- Add fetch_content setting to feeds table
ALTER TABLE feeds ADD COLUMN fetch_content INTEGER DEFAULT 0;

-- Add full_content column to items table for storing extracted article content
ALTER TABLE items ADD COLUMN full_content TEXT;
