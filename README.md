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
const { ChatGPTClient } = require('unofficial-chatgpt-api');
const gpt = new ChatGPTClient(
  '<---SESSION_TOKEN_1--->',
  '<---SESSION_TOKEN_2--->',
);
```

### Auto-refresh

Library manages auto-refreshing tokens.
To get the initial session tokens:

1. Visit: https://chat.openai.com/chat
2. Open network tab in chrome: find request to url https://chat.openai.com/api/auth/session
3. Click on the request, click on cookies
4. At the bottom it will say "Response Cookies"
5. Copy the value of the first cookie and paste it in the client (Name: `__Secure-next-auth.session-token.0`)
6. Copy the value of the second cookie and paste it in the client (Name: `__Secure-next-auth.session-token.1`)

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
