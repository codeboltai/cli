
const codebolt = require('@codebolt/codeboltjs');
codebolt.onMessage(async (message) => {
    try {
      const response = await codebolt.chat.sendMessage(message.data.text)

    } catch (error) {
        console.log(error)
    }
})
