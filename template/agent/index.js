const codebolt = require('@codebolt/codeboltjs').default;

codebolt.chat.onActionMessage().on("userMessage", async (req, response) => {
     codebolt.chat.sendMessage("Hello from Codebolt");
     response("done")
 
})


