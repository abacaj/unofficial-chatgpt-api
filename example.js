const assert = require('assert');
const { ChatGPTClient } = require('unofficial-chatgpt-api');

async function main() {
  const gpt = new ChatGPTClient('<---ENTER-TOKEN--->');

  try {
    const m1 = await gpt.chat('show me some javascript code:');
    console.log(m1.message.content.parts);

    const m2 = await gpt.chat('what was the first question I asked you?');
    assert(
      m2.message.content.parts.find((msg) =>
        msg.toLowerCase().includes('show me some javascript code'),
      ),
      'failed to maintain conversation',
    );

    // reset the conversation thread
    gpt.resetThread();

    const m3 = await gpt.chat('what was the first question I asked you?');
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
