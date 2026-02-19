import fs from "fs";
import path from "path";
import os from "os";

const HISTORY_FILE = path.join(os.homedir(), ".orbit_history");
const MAX_HISTORY_SIZE = 100;

export class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.loadHistory();
    }

    /**
     * Load history from the persistent file
     */
    loadHistory() {
        try {
            if (fs.existsSync(HISTORY_FILE)) {
                const data = fs.readFileSync(HISTORY_FILE, "utf8");
                const lines = data.split("\n").filter((line) => line.trim().length > 0);
                
                // Try parsing as JSON (new format), fallback to plain strings (legacy)
                this.history = lines.map(line => {
                    try {
                        const parsed = JSON.parse(line);
                        // Validate the parsed object has required fields
                        if (parsed && typeof parsed.cmd === 'string' && parsed.timestamp) {
                            return parsed;
                        }
                    } catch {
                        // Legacy format: plain string
                    }
                    // Convert legacy format or invalid entries to new format
                    return { cmd: line, timestamp: new Date().toISOString() };
                }).slice(-MAX_HISTORY_SIZE); // Keep only last MAX_HISTORY_SIZE entries
                
                this.currentIndex = this.history.length;
            }
        } catch (error) {
            console.error("Failed to load history:", error.message);
            this.history = [];
        }
    }

    /**
     * Save history to the persistent file
     */
    saveHistory() {
        try {
            const historyContent = this.history
                .slice(-MAX_HISTORY_SIZE)
                .map(entry => JSON.stringify(entry))
                .join("\n");
            fs.writeFileSync(HISTORY_FILE, historyContent + "\n", "utf8");
        } catch (error) {
            console.error("Failed to save history:", error.message);
        }
    }

    /**
     * Add a new entry to history
     * @param {string} entry - The command to add
     */
    add(entry) {
        const trimmed = entry.trim();
        if (trimmed.length === 0) return;

        // Don't add duplicate consecutive entries
        if (this.history.length > 0 && this.history[this.history.length - 1].cmd === trimmed) {
            return;
        }

        const historyEntry = {
            cmd: trimmed,
            timestamp: new Date().toISOString()
        };
        
        this.history.push(historyEntry);
        
        // Enforce MAX_HISTORY_SIZE limit on in-memory array
        this.history = this.history.slice(-MAX_HISTORY_SIZE);
        
        this.currentIndex = this.history.length;
        this.saveHistory();
    }

    /**
     * Get the previous entry in history
     * @returns {string|null}
     */
    getPrevious() {
        if (this.history.length === 0) return null;
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
        return this.history[this.currentIndex]?.cmd || null;
    }

    /**
     * Get the next entry in history
     * @returns {string|null}
     */
    getNext() {
        if (this.history.length === 0) return null;
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            return this.history[this.currentIndex]?.cmd;
        } else {
            this.currentIndex = this.history.length;
            return ""; // Return empty string when at the end
        }
    }

    /**
     * Reset the current index to the end of history
     */
    reset() {
        this.currentIndex = this.history.length;
    }

    /**
     * Get all history entries
     * @returns {string[]}
     */
    getAll() {
        return [...this.history];
    }

    /**
     * Get recent history entries
     * @param {number} count - Number of recent entries to return
     * @returns {string[]}
     */
    getRecent(count = 5) {
        return this.history.slice(-count);
    }

    /**
     * Clear all history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        try {
            if (fs.existsSync(HISTORY_FILE)) {
                fs.unlinkSync(HISTORY_FILE);
            }
        } catch (error) {
            console.error("Failed to clear history:", error.message);
        }
    }

    /**
     * Get the history file path
     * @returns {string}
     */
    static getHistoryPath() {
        return HISTORY_FILE;
    }
}

// Export a singleton instance
export const historyManager = new HistoryManager();
