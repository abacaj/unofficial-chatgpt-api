# unofficial-chatgpt-api

## Getting Started

### Installation

To use ChatGPT in your application, run:

```bash
npm i unofficial-chatgpt-api
# or `yarn add unofficial-chatgpt-api`
# or `pnpm i unofficial-chatgpt-api`
```

### Configuration

```js
// dual token
const { ChatGPTClient } = require('unofficial-chatgpt-api');
const gpt = new ChatGPTClient(
  '<---SESSION_TOKEN_1--->',
  '<---SESSION_TOKEN_2--->',
);
```

```js
// single token
const { ChatGPTClient } = require('unofficial-chatgpt-api');
const gpt = new ChatGPTClient('<---SESSION_TOKEN--->');
```

### Auto-refresh

Library manages auto-refreshing tokens.

**Dual tokens**

Some accounts require dual tokens:

1. Visit: https://chat.openai.com/chat
2. Open devtools in chrome: visit the application tab
3. Click on cookies in the left under storage, click on the chat.openai.com domain
4. Copy the value of the first cookie and paste it in the client (Name: `__Secure-next-auth.session-token.0`)
5. Copy the value of the second cookie and paste it in the client (Name: `__Secure-next-auth.session-token.1`)

**Single token**

Some accounts require single token:

1. Visit: https://chat.openai.com/chat
2. Open devtools in chrome: visit the application tab
3. Click on cookies in the left under storage, click on the chat.openai.com domain
4. Copy the value of the first cookie and paste it in the client (Name: `__Secure-next-auth.session-token`)

### Chatting

```js
const convo = await gpt.startConversation();
const m1 = await convo.chat('show me some javascript code:');

const m2 = await convo.chat('who created you?');
console.log(m2.message.content.parts);
```

### Multiple conversations

```js
const convo1 = await gpt.startConversation();
const convo2 = await gpt.startConversation();

const m1 = await convo1.chat('show me some javascript code:');
const m2 = await convo2.chat('who created you?');
console.log(m2.message.content.parts);
```

### Reset conversation (thread)

```js
convo.reset();
```
