const https = require('https');
const crypto = require('crypto');
const sseSubstring = 'data: '.length;

/**
 * @returns {Promise<string[]>}
 */
function post(url, data, bearerToken) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        'content-type': 'application/json',
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + bearerToken,
        },
      },
      (res) => {
        res.setEncoding('utf-8');

        const streamData = [];
        if (res.statusCode !== 200) {
          return reject(new Error(res.statusMessage));
        }

        res.on('data', (c) => streamData.push(c.substring(sseSubstring)));
        res.on('end', () => resolve(streamData));
      },
    );

    req.on('error', reject);

    req.write(JSON.stringify(data));
    req.end();
  });
}

class ChatGPTClient {
  #conversationId = null;
  #bearerToken = null;

  constructor(bearerToken) {
    this.#bearerToken = bearerToken;
  }

  /**
   * @returns {Promise<{message: {id: string,role: string,user: any,create_time: any,update_time: any,content: { content_type: string, parts: string[] },end_turn: any,weight: number,metadata: {},recipient: string }, conversation_id: string, error: any}>}
   */
  async chat(message) {
    const payload = {
      action: 'next',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: { content_type: 'text', parts: [message] },
        },
      ],
      parent_message_id: crypto.randomUUID(),
      model: 'text-davinci-002-render',
    };

    // add the convo id if we already have one started
    if (this.#conversationId) {
      payload.conversationId = this.#conversationId;
    }

    const res = await post(
      'https://chat.openai.com/backend-api/conversation',
      payload,
      this.#bearerToken,
    );

    return JSON.parse(res[res.length - 2]);
  }

  resetThread() {
    this.#conversationId = null;
  }
}

module.exports = ChatGPTClient;
