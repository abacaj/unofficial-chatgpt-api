const assert = require('assert');
const { ChatGPTClient } = require('unofficial-chatgpt-api');

async function main() {
  const gpt = new ChatGPTClient(
    '<---SESSION_TOKEN_1--->',
    '<---SESSION_TOKEN_2--->',
  );

  try {
    const convo = await gpt.startConversation();
    const m1 = await convo.chat('show me some javascript code:');
    console.log(m1.message.content.parts);

    const m2 = await convo.chat('what was the first question I asked you?');
    assert(
      m2.message.content.parts.find((msg) =>
        msg.toLowerCase().includes('show me some javascript code'),
      ),
      'failed to maintain conversation',
    );

    // // reset the conversation thread
    convo.reset();

    const m3 = await convo.chat('what was the first question I asked you?');
    assert(
      !m3.message.content.parts.find((msg) =>
        msg.toLowerCase().includes('show me some javascript code'),
      ),
      'failed to reset conversation',
    );
  } catch (ex) {
    console.error(ex);
  }
}

main();
