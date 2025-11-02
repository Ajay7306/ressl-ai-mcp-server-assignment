import fs from "fs";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";


const searchTool: Tool = {
  name: "search keyword in file",
  description: "Search for a specified keyword within a file.",
  inputSchema: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "Path to the text file" },
      keyword: { type: "string", description: "Keyword to search for" },
    },
    required: ["filePath", "keyword"],
  },
};

const server = new Server(
  {
    name: "keyword-search-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [searchTool],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search keyword in file") {
    const { filePath, keyword } = request.params.arguments as {
      filePath: string;
      keyword: string;
    };

    if (!fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: File not found: ${filePath}`,
          },
        ],
      };
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const matches = lines
      .map((line, index) => ({ lineNumber: index + 1, text: line }))
      .filter((line) => line.text.includes(keyword));

    const result =
      matches.length > 0
        ? matches.map((m) => `The Keyword ${keyword} was found at line no. ${m.lineNumber}: ${m.text}`).join("\n")
        : `No matches found for the keyword "${keyword}" in the file.`;

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Keyword Search MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});