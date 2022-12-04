import https from 'https';
import crypto from 'crypto';
const sseSubstring = 'data: '.length;

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
  conversationId?: string;
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
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + bearerToken,
        },
      },
      (res) => {
        res.setEncoding('utf-8');

        const streamData: string[] = [];
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

export class ChatGPTClient {
  #conversationId: string | null = null;
  #bearerToken: string;

  constructor(bearerToken: string) {
    this.#bearerToken = bearerToken;
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
