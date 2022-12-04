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
const gpt = new ChatGPTClient('<--ENTER-BEARER-TOKEN-->');
```

### Chatting

```js
const m1 = await gpt.chat('where are you from?');
console.log(m1.message.content.parts);

const m2 = await gpt.chat('who created you?');
console.log(m2.message.content.parts);
```

### Reset conversation (thread)

```js
gpt.resetThread();
```
