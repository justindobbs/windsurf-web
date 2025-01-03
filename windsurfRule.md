## Web Content Extraction Rule

When a prompt begins with "@web [url]", the AI should:

1. Execute the following steps:
   - Run command: `node ./windsurfWeb/webExtract.js [url]`
   - Wait for the extraction results
   - Process and store the extracted content in memory for the current conversation only

2. Requirements for implementation:
   - The `webExtract.js` script should be located in the `./windsurfWeb/` directory
   - The script should handle:
     - URL validation
     - Content extraction
     - Error handling
     - Formatted output

3. Usage example:
   User: "@web https://example.com"
   AI: *executes extraction and incorporates the content in its responses*

4. Scope:
   - Extracted content is only available within the current conversation
   - Content is cleared when the conversation ends
   - Each new "@web" command refreshes the stored content

5. Error handling:
   - Invalid URLs should return appropriate error messages
   - Network failures should be gracefully handled
   - Timeout conditions should be managed

Don't check if the script exists nor try to update it. Just run it.
