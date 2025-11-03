/**
 * Default Markdown Parser
 * 
 * Extracts frontmatter as fields and body as 'content' field
 * Works for 80% of simple data models
 */

import { extract } from 'jsr:@std/front-matter/yaml';
import type { MarkdownParser } from '../core.ts';

/**
 * Default markdown parser
 * Handles standard frontmatter + body format
 * 
 * Example markdown:
 * ---
 * id: example
 * name: Example Name
 * field: value
 * ---
 * 
 * Body content here...
 */
export class DefaultMarkdownParser implements MarkdownParser {
  async parse(
    content: string,
    recordId: string,
  ): Promise<Record<string, unknown>> {
    const { attrs, body } = extract<Record<string, unknown>>(
      content,
    );

    // Ensure ID matches filename
    const data: Record<string, unknown> = {
      id: recordId,
      ...attrs,
    };

    // Add body content if present
    const trimmedBody = body.trim();
    if (trimmedBody) {
      data.content = trimmedBody;
    }

    return data;
  }
}
