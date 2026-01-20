/**
 * Generate a deterministic color from a string (genre name)
 * Returns CSS custom properties for accessible colored badges
 */
export const getTextColor = (genre: string): Record<string, string> => {
    // Simple hash function to generate a deterministic number from string
    let hash = 0;
    for (let i = 0; i < genre.length; i++) {
        hash = genre.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert hash to hue (0-360)
    const hue = Math.abs(hash) % 360;

    // Use different saturation and lightness based on hue for better variety
    // Higher saturation for more vivid colors
    const saturation = 65 + (Math.abs(hash >> 8) % 15); // 65-80%

    // Return CSS custom properties object that works with light/dark mode
    return {
        "--genre-hue": `${hue}`,
        "--genre-sat": `${saturation}%`,
        "--genre-light-bg": `${85 + (Math.abs(hash >> 16) % 8)}%`, // 85-93% for light mode bg
        "--genre-light-text": `${25 + (Math.abs(hash >> 24) % 15)}%`, // 25-40% for light mode text
        "--genre-dark-bg": `${20 + (Math.abs(hash >> 16) % 8)}%`, // 20-28% for dark mode bg
        "--genre-dark-text": `${85 + (Math.abs(hash >> 24) % 10)}%`, // 85-95% for dark mode text
    } as Record<string, string>;
};
