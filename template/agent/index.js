const codebolt = require('@codebolt/codeboltjs');

const { UserMessage, SystemPrompt, TaskInstruction, Agent } = require("@codebolt/codeboltjs/utils");

codebolt.onMessage(async (reqMessage) => {
    try {

        //  await codebolt.chat.sendMessage("hello form act");
        const userMessage = new UserMessage(reqMessage.message);
        const systemPrompt = new SystemPrompt("./agent.yaml", "test");
        const {data} = await codebolt.tools.listToolsFromToolBoxes(["codebolt"]);
        const agentTools = data;
        const task = new TaskInstruction(agentTools, userMessage, "./task.yaml", "main_task");
        const agent = new Agent(agentTools, systemPrompt);
        const {message, success, error } = await agent.run(task);
        return message ? message : error;


    } catch (error) {
        console.log(error)
    }
})