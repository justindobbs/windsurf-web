# windsurf-web
Easy @web extraction tool for windsurf

## Overview

The Windsurf IDE does not yet have the @web extract feature that Cursor has. This feature allows the user to type in @web [url] in their chat and have the agent store the extracted information in its memory for the duration of the conversation.

The following is an example of how to implement it into your Windsurf experience yourself, if you are using Node.js. 

This is just a quick example, and there are other kinds of web extraction utilities you could use for this.

## Usage

1. Create the folder in your project /windsurfWeb.
2. Copy the webExtract.js into the folder.
3. Install the dependencies (Cheerio, etc...) with npm install
4. Click on Windsurf Settings in the bottom right corner of Windsurf and edit Set Global AI Rules. Then you can copy the rules from the provided .md in this repo.
5. (Optional) If you want the agent to auto-execute, go to Settings, Windsurf Editor, and add an item to the Cascade Settings Allow List. Put in the exact command: node ./windsurfWeb/webExtract.js

Then in your chat, try it out by typing @web [yourURL]
