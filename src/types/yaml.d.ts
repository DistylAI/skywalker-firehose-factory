interface AgentConfig {
  name: string;
  instructions: string;
  handoffDescription?: string;
  modelSettings?: {
    toolChoice?: string;
  };
  tools?: string[];
}

declare module '*.yaml' {
  const value: AgentConfig;
  export default value;
}

declare module '*.yml' {
  const value: AgentConfig;
  export default value;
} 