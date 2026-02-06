/**
 * Modular Validation Library
 * 
 * Provides reusable validation functions for repository consistency checking.
 */

import fs from 'fs';
import path from 'path';

/**
 * Read a file safely
 * @param {string} filePath - Path to file
 * @returns {string|null} File content or null
 */
export function readFileSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Find pattern matches in file content
 * @param {string} content - File content
 * @param {string|RegExp} pattern - Pattern to search for
 * @returns {Array} Array of matches with line numbers
 */
export function findPatternMatches(content, pattern) {
  const matches = [];
  const lines = content.split('\n');
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g');

  lines.forEach((line, index) => {
    const lineMatches = [...line.matchAll(regex)];
    lineMatches.forEach(match => {
      matches.push({
        line: index + 1,
        content: line.trim(),
        match: match[0],
        groups: match.groups || {}
      });
    });
  });

  return matches;
}

export default {
  readFileSafe,
  findPatternMatches
};
