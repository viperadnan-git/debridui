-- Custom SQL migration file, put your code below! --

-- Create trigger function to enforce max 20 entries per user
-- Automatically deletes oldest entries when a user exceeds 20 search history items
CREATE OR REPLACE FUNCTION enforce_search_history_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete oldest entries if user has more than 20
    -- Uses CTE for better performance and clarity
    WITH entries_to_delete AS (
        SELECT id
        FROM search_history
        WHERE user_id = NEW.user_id
        ORDER BY updated_at DESC
        OFFSET 20  -- Keep first 20 (most recent), delete the rest
    )
    DELETE FROM search_history
    WHERE id IN (SELECT id FROM entries_to_delete);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after INSERT only
-- UPDATE doesn't increase row count, so no cleanup needed
CREATE TRIGGER search_history_cleanup_trigger
    AFTER INSERT ON search_history
    FOR EACH ROW
    EXECUTE FUNCTION enforce_search_history_limit();

-- Add helpful comments for documentation
COMMENT ON FUNCTION enforce_search_history_limit() IS 'Automatically enforces max 20 search history entries per user by deleting oldest entries';
COMMENT ON TRIGGER search_history_cleanup_trigger ON search_history IS 'Maintains max 20 entries per user by cleaning up oldest records';
