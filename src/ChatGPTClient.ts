import https from 'https';
import crypto from 'crypto';
import { IncomingHttpHeaders } from 'http';
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

type AuthResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
    picture: string;
    groups: string[];
    features: string[];
  };
  expires: string;
  accessToken: string;
};

function post(
  ua: string,
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
          'User-Agent': ua,
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

function get(
  ua: string,
  url: string,
  sessionToken0: string,
  sessionToken1: string,
): Promise<{ body: string; headers: IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          cookie: `__Secure-next-auth.session-token.0=${sessionToken0}; __Secure-next-auth.session-token.1=${sessionToken1}`,
          'User-Agent': ua,
        },
      },
      (res) => {
        res.setEncoding('utf-8');

        let streamData = '';
        if (res.statusCode !== 200) {
          return reject(new Error(res.statusMessage));
        }

        res.on('data', (c) => (streamData += c));
        res.on('end', () =>
          resolve({ body: streamData, headers: res.headers }),
        );
      },
    );

    req.on('error', reject);
  });
}

export class ChatGPTConversation {
  #parentId: string;
  #bearerToken: string;
  #ua: string;
  #conversationId: string | null;
  #refreshToken: () => Promise<string>;

  constructor(
    ua: string,
    bearerToken: string,
    refreshToken: () => Promise<string>,
  ) {
    this.#ua = ua;
    this.#conversationId = null;
    this.#bearerToken = bearerToken;
    this.#parentId = crypto.randomUUID();
    this.#refreshToken = refreshToken;
  }

  reset() {
    this.#parentId = crypto.randomUUID();
    this.#conversationId = null;
  }

  async chat(message: string) {
    // refresh token, will return cached one if not expired
    this.#bearerToken = await this.#refreshToken();

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

    if (this.#conversationId) {
      payload.conversation_id = this.#conversationId;
    }

    const response = await post(
      this.#ua,
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
}

export class ChatGPTClient {
  #sessionToken0: string;
  #sessionToken1: string;
  #lastTokenRefresh: Date | null;
  #bearerToken: string | null;
  #refreshIntervalMinutes: number;
  #ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 x-openai-assistant-app-id';

  /**
   *
   * @param {string} sessionToken0 __Secure-next-auth.session-token.0
   * @param {string} sessionToken1 __Secure-next-auth.session-token.1
   * @param {number} refreshIntervalMinutes Defaults to 5 minutes
   */
  constructor(
    sessionToken0: string,
    sessionToken1: string,
    refreshIntervalMinutes = 5,
  ) {
    this.#sessionToken0 = sessionToken0;
    this.#sessionToken1 = sessionToken1;
    this.#refreshIntervalMinutes = refreshIntervalMinutes;
    this.#bearerToken = null;
    this.#lastTokenRefresh = null;
  }

  async startConversation(): Promise<ChatGPTConversation> {
    await this.#refreshBearerToken();
    if (!this.#bearerToken)
      throw new Error('Session tokens are expired/invalid');

    return new ChatGPTConversation(
      this.#ua,
      this.#bearerToken,
      this.#refreshBearerToken.bind(this),
    );
  }

  async #refreshBearerToken(): Promise<string> {
    const now = new Date();
    if (
      this.#lastTokenRefresh &&
      now < this.#lastTokenRefresh &&
      this.#bearerToken
    )
      return this.#bearerToken;

    const response = await get(
      this.#ua,
      'https://chat.openai.com/api/auth/session',
      this.#sessionToken0,
      this.#sessionToken1,
    );

    const cookies = response.headers['set-cookie'];
    const json = JSON.parse(response.body) as AuthResponse;

    if (!json.accessToken || !cookies)
      throw new Error('Failed to refresh token, session expired/invalid');

    now.setMinutes(now.getMinutes() + this.#refreshIntervalMinutes);
    const sessionTokens = cookies.filter((cookie) =>
      cookie.startsWith('__Secure-next-auth.session-token'),
    );

    if (sessionTokens.length !== 2)
      throw new Error('Failed to refresh dual session-tokens from headers');

    this.#lastTokenRefresh = now;
    this.#bearerToken = json.accessToken;
    this.#sessionToken0 = sessionTokens[0];
    this.#sessionToken1 = sessionTokens[1];
    return json.accessToken;
  }
}
