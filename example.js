const ChatGPTClient = require('./Client');

async function main() {
  const gpt = new ChatGPTClient('<---ENTER-TOKEN--->');

  try {
    const m1 = await gpt.chat('where are you from?');
    console.log(m1.message.content.parts);

    const m2 = await gpt.chat('who created you?');
    console.log(m2.message.content.parts);

    // reset conversation
    gpt.resetThread();

    const m3 = await gpt.chat("what's your name?");
    console.log(m3.message.content.parts);
  } catch (ex) {
    console.error(ex);
  }
}

main();
