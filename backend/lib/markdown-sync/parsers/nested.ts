/**
 * Generic Nested Markdown Parser
 * 
 * A configurable parser that can handle documents with nested collections
 * (e.g., workout categories with exercises, blog posts with comments, etc.)
 * 
 * Configuration example in sync-config.json:
 * {
 *   "models": {
 *     "workout-categories": {
 *       "parser": "nested",
 *       "parserConfig": {
 *         "nestedField": "exercises",
 *         "nestedHeadingLevel": 3,
 *         "nestedFields": {
 *           "sets": "number",
 *           "repetitions": "string",
 *           "difficulty": "string",
 *           "order": "number",
 *           "description": "string"
 *         },
 *         "generateIds": true,
 *         "sortBy": "order"
 *       }
 *     }
 *   }
 * }
 */

import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts';
import { extract } from 'jsr:@std/front-matter/yaml';
import type { MarkdownParser } from '../core.ts';

export interface NestedParserConfig {
  /** Name of the nested collection field (e.g., "exercises", "comments") */
  nestedField: string;
  
  /** Markdown heading level for nested items (2 = ##, 3 = ###, etc.) */
  nestedHeadingLevel: number;
  
  /** Field definitions for nested items: { fieldName: 'string' | 'number' | 'boolean' } */
  nestedFields: Record<string, 'string' | 'number' | 'boolean'>;
  
  /** Whether to generate IDs for nested items (uses nanoid) */
  generateIds?: boolean;
  
  /** Field to sort nested items by */
  sortBy?: string;
  
  /** Name field for nested items (defaults to heading text) */
  nameField?: string;
}

/**
 * Generic parser for documents with nested collections
 * 
 * Example markdown structure:
 * ---
 * id: record-id
 * field1: value1
 * field2: value2
 * ---
 * 
 * ### Nested Item 1
 * - **Field1**: Value
 * - **Field2**: Value
 * 
 * ### Nested Item 2
 * - **Field1**: Value
 * - **Field2**: Value
 */
export class NestedMarkdownParser implements MarkdownParser {
  private config: NestedParserConfig;

  constructor(config: NestedParserConfig) {
    this.config = config;
  }

  async parse(
    content: string,
    recordId: string,
  ): Promise<Record<string, unknown>> {
    const { attrs, body } = extract<Record<string, unknown>>(content);

    // Parse nested items from markdown body
    const nestedItems = this.parseNestedItems(body);

    // Return all frontmatter attributes plus the nested collection
    return {
      ...attrs,
      id: recordId,
      [this.config.nestedField]: nestedItems,
    };
  }

  /**
   * Parse nested items from markdown body
   */
  private parseNestedItems(markdown: string): Array<Record<string, unknown>> {
    const items: Array<Record<string, unknown>> = [];
    const headingMarker = '#'.repeat(this.config.nestedHeadingLevel);
    const headingRegex = new RegExp(`^${headingMarker} (.+)$`, 'gm');

    // Split by nested item headings
    const sections = markdown.split(headingRegex).slice(1);

    for (let i = 0; i < sections.length; i += 2) {
      const name = sections[i].trim();
      const content = sections[i + 1];

      const item: Record<string, unknown> = {};

      // Add ID if configured
      if (this.config.generateIds) {
        item.id = nanoid();
      }

      // Add name from heading
      const nameField = this.config.nameField || 'name';
      item[nameField] = name;

      // Extract configured fields
      for (const [fieldName, fieldType] of Object.entries(this.config.nestedFields)) {
        const value = this.extractValue(content, fieldName);
        item[fieldName] = this.convertValue(value, fieldType);
      }

      items.push(item);
    }

    // Sort if configured
    if (this.config.sortBy && items.length > 0) {
      items.sort((a, b) => {
        const aVal = a[this.config.sortBy!];
        const bVal = b[this.config.sortBy!];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return aVal - bVal;
        }
        
        return String(aVal).localeCompare(String(bVal));
      });
    }

    return items;
  }

  /**
   * Extract a value from markdown content
   */
  private extractValue(content: string, field: string): string {
    // Try different markdown formats
    const formats = [
      new RegExp(`\\*\\*${field}\\*\\*:\\s*(.+)`, 'i'), // **Field**: Value
      new RegExp(`${field}:\\s*(.+)`, 'i'),             // Field: Value
      new RegExp(`-\\s*\\*\\*${field}\\*\\*:\\s*(.+)`, 'i'), // - **Field**: Value
    ];

    for (const regex of formats) {
      const match = content.match(regex);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * Convert string value to specified type
   */
  private convertValue(
    value: string,
    type: 'string' | 'number' | 'boolean',
  ): string | number | boolean {
    if (!value) {
      if (type === 'number') return 0;
      if (type === 'boolean') return false;
      return '';
    }

    switch (type) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      
      case 'boolean':
        return value.toLowerCase() === 'true' || 
               value === '1' || 
               value.toLowerCase() === 'yes';
      
      case 'string':
      default:
        return value;
    }
  }
}

/**
 * Factory function to create parser from config
 */
export function createNestedParser(
  config: NestedParserConfig,
): MarkdownParser {
  return new NestedMarkdownParser(config);
}
