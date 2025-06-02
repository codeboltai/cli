
const codebolt = require('@codebolt/codeboltjs').default;

const { UserMessage, SystemPrompt, TaskInstruction, Agent } = require("@codebolt/codeboltjs/utils");

codebolt.chat.onActionMessage().on("userMessage", async (req, response) => {
    try {
        const userMessage = new UserMessage(req.message);
        const systemPrompt = new SystemPrompt("./agent.yaml", "test");
        const agentTools = await codebolt.tools.listToolsFromToolBoxes(["codebolt"]);
        const task = new TaskInstruction(agentTools, userMessage, "./task.yaml", "main_task");
        const agent = new Agent(agentTools, systemPrompt);
        const {message, success, error } = await agent.run(task);
        response(message ? message : error);

    } catch (error) {
        console.log(error)
    }
})
