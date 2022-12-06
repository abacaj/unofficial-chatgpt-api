import https from 'https';
import crypto from 'crypto';
const sseSubstringLength = 'data: '.length;

type PayloadMessage = {
  id: string;
  role: string;
  content: { content_type: string; parts: string[] };
};

type Payload = {
  action: string;
  messages: PayloadMessage[];
  parent_message_id: string;
  model: string;
  conversation_id?: string;
};

type Response = {
  message: {
    id: string;
    role: string;
    user: any;
    create_time: any;
    update_time: any;
    content: { content_type: string; parts: string[] };
    end_turn: any;
    weight: number;
    metadata: {};
    recipient: string;
  };
  conversation_id: string;
  error: any;
};

function post(
  url: string,
  data: Record<string, unknown>,
  bearerToken: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + bearerToken,
          'Content-Type': 'application/json',
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 x-openai-assistant-app-id`,
        },
      },
      (res) => {
        res.setEncoding('utf-8');

        let streamData = '';
        if (res.statusCode !== 200) {
          return reject(new Error(res.statusMessage));
        }

        res.on('data', (c) => (streamData += c));
        res.on('end', () => resolve(streamData));
      },
    );

    req.on('error', reject);

    req.write(JSON.stringify(data));
    req.end();
  });
}

export class ChatGPTClient {
  #conversationId: string | null = null;
  #parentId: string;
  #bearerToken: string;

  constructor(bearerToken: string) {
    this.#bearerToken = bearerToken;
    this.#parentId = crypto.randomUUID();
  }

  async chat(message: string): Promise<Response> {
    const payload: Payload = {
      action: 'next',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: { content_type: 'text', parts: [message] },
        },
      ],
      parent_message_id: this.#parentId,
      model: 'text-davinci-002-render',
    };

    // add the convo id if we already have one started
    if (this.#conversationId) {
      payload.conversation_id = this.#conversationId;
    }

    const response = await post(
      'https://chat.openai.com/backend-api/conversation',
      payload,
      this.#bearerToken,
    );

    const sseMessages = response.split('\n').filter((s) => s.length);
    const result = JSON.parse(
      sseMessages[sseMessages.length - 2].substring(sseSubstringLength),
    ) as Response;

    this.#conversationId = result.conversation_id;
    this.#parentId = result.message.id;

    return result;
  }

  resetThread() {
    this.#conversationId = null;
    this.#parentId = crypto.randomUUID();
  }
}
