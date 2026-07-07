#!/usr/bin/env node

const fs = require("fs");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const command = input.tool_input?.command || "";

const dangerousPatterns = [
  /\bStop-Process\b/i,
  /\btaskkill\b/i,
  /\bkill\b/i,
  /\brm\s+-rf\b/i,
  /\bRemove-Item\b.*\b-Recurse\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\b/i,
  /\bdocker\s+compose\s+down\s+-v\b/i,
  /\bdocker\s+volume\s+rm\b/i,
  /\bdocker\s+system\s+prune\b/i
];

const matched = dangerousPatterns.find((pattern) => pattern.test(command));

if (matched) {
  console.error(
    [
      "BLOCKED: Potentially dangerous shell command.",
      "",
      `Command: ${command}`,
      "",
      "Ask the human for explicit approval before running destructive or process-killing commands."
    ].join("\n")
  );
  process.exit(2);
}

process.exit(0);