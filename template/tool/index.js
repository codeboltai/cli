import { ToolBox } from '@codebolt/codeboltjs/utils';
import { z } from 'zod';

const toolbox = new ToolBox({
  name: "MyTools",
  version: "1.0.0"
});

toolbox.addTool({
  name: "hello",
  description: "Says hello",
  parameters: z.object({
    name: z.string().describe("Name to greet")
  }),
  execute: async (args, context) => {
    return `Hello, ${args.name}!`;
  }
});

async function main() {
  try {
    await toolbox.activate();
    console.log('Toolbox is running!');
  } catch (error) {
    console.error('Failed to start toolbox:', error);
  }
}

main();

