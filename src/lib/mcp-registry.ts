export interface McpRegistryEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultType: "command" | "sse" | "streamableHttp";
  defaultCommand?: string;
  defaultArgs?: string[];
  defaultUrl?: string;
  requiresEnv?: { key: string; label: string; placeholder: string }[];
}

export const MCP_REGISTRY: McpRegistryEntry[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Repository management, issues, PRs, and code search",
    icon: "GH",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-github"],
    requiresEnv: [
      {
        key: "GITHUB_PERSONAL_ACCESS_TOKEN",
        label: "GitHub Token",
        placeholder: "ghp_...",
      },
    ],
  },
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Read, write, and manage files on the local filesystem",
    icon: "FS",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-filesystem", "."],
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Query and manage PostgreSQL databases",
    icon: "PG",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-postgres"],
    requiresEnv: [
      {
        key: "POSTGRES_CONNECTION_STRING",
        label: "Connection string",
        placeholder: "postgresql://user:pass@host:5432/db",
      },
    ],
  },
  {
    id: "brave-search",
    name: "Brave Search",
    description: "Web and local search powered by Brave",
    icon: "BR",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-brave-search"],
    requiresEnv: [
      {
        key: "BRAVE_API_KEY",
        label: "Brave API key",
        placeholder: "BSA...",
      },
    ],
  },
  {
    id: "memory",
    name: "Memory",
    description: "Knowledge graph-based persistent memory for conversations",
    icon: "ME",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-memory"],
  },
  {
    id: "puppeteer",
    name: "Puppeteer",
    description: "Browser automation, screenshots, and web scraping",
    icon: "PP",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-puppeteer"],
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    description: "Dynamic problem-solving through thought sequences",
    icon: "ST",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
  },
  {
    id: "fetch",
    name: "Fetch",
    description: "Fetch and convert web content to markdown",
    icon: "FE",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-fetch"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Read and manage Slack channels and messages",
    icon: "SL",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-slack"],
    requiresEnv: [
      {
        key: "SLACK_BOT_TOKEN",
        label: "Slack Bot token",
        placeholder: "xoxb-...",
      },
    ],
  },
  {
    id: "google-maps",
    name: "Google Maps",
    description: "Location search, directions, and place details",
    icon: "GM",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-google-maps"],
    requiresEnv: [
      {
        key: "GOOGLE_MAPS_API_KEY",
        label: "Maps API key",
        placeholder: "AIza...",
      },
    ],
  },
  {
    id: "sqlite",
    name: "SQLite",
    description: "Query and manage SQLite databases",
    icon: "SQ",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-sqlite"],
  },
  {
    id: "everart",
    name: "EverArt",
    description: "AI image generation using various models",
    icon: "EA",
    defaultType: "command",
    defaultCommand: "npx",
    defaultArgs: ["-y", "@modelcontextprotocol/server-everart"],
    requiresEnv: [
      {
        key: "EVERART_API_KEY",
        label: "EverArt API key",
        placeholder: "Your API key",
      },
    ],
  },
];
