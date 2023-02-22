import './fetch-polyfill.js';
import crypto from 'crypto';
import './fetch-polyfill.js';
import { fetchEventSource } from '@waylaidwanderer/fetch-event-source';

declare var resolve: any
declare var controller: any

export default class SummarizeClient {
    modelOptions: any;
    sessionToken: any;
    constructor(
        sessionToken: any,
    ) {
        this.sessionToken = sessionToken;

        this.modelOptions = {
            action: 'next',
            messages: [
                {
                    id: crypto.randomUUID(),
                    role: 'user',
                    content: {
                        content_type: 'text',
                        parts: []
                    }
                }
            ],
            model: 'text-davinci-002-render-sha',
            parent_message_id: crypto.randomUUID()
        };
    }

    async getCompletion(prompt, conversationId, parentMessageId?, onProgress?) {
        const modelOptions = { ...this.modelOptions };
        if (typeof onProgress === 'function') {
            modelOptions.stream = true;
        }
        modelOptions.stream = true;
        modelOptions.messages[0].id = crypto.randomUUID();
        modelOptions.messages[0].content.parts[0] = prompt;
        const url = "https://chat.duti.tech/api/conversation"
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.sessionToken}`,
            },
            body: JSON.stringify(modelOptions),
            onMessage: (message) => {
                if(message.data === '[DONE]') {
                    onProgress('[DONE]');
                    controller.abort();
                    resolve();
                    return;
                }
            onProgress(JSON.parse(message.data));
        },

        };
        if (modelOptions.stream) {
            return new Promise<void>(async (resolve, reject) => {
                const controller = new AbortController();
                try {
                    await fetchEventSource(url, {
                        ...opts,
                        signal: controller.signal,
                        async onopen(response) {
                            if (response.status === 200) {
                                return;
                            }
                            let error;
                            try {
                                const body = await response.text();
                                error = new Error(`Failed to send message. HTTP ${response.status} - ${body}`);
                                error.status = response.status;
                                error.json = JSON.parse(body);
                            } catch {
                                error = error || new Error(`Failed to send message. HTTP ${response.status}`);
                            }
                            throw error;
                        },
                        onmessage(message) {
                            try {
                            if (message.data === '[DONE]') {
                                onProgress('[DONE]');
                                controller.abort();
                                resolve();
                                return;
                            }
                            onProgress(JSON.parse(message.data));
                        }
                        catch(err){
                            // console.log(err);
                        }
                        },
                    });

        } catch (err) {
            reject(err);
        }
    });
}
const response = await fetch(url, opts);
if (response.status !== 200) {
    const body = await response.text();
    const error: any = new Error(`Failed to send message. HTTP ${response.status} - ${body}`);
    error.status = response.status;
    try {
        error.json = JSON.parse(body);
    } catch {
        error.body = body;
    }
    throw error;
}
return response.json();
    }
    /**
     * Summarizes a input into a nice, smaller paragraph.
     * 
     * @param message - Your input paragraph.
     * @param max_length - The max word limit of the paragraph.
     * @param min_length - The minimum word limit of the paragraph.
     * @returns 
     */
    async summarize(
    message,
    max_length?,
    min_length?
) {
    const conversationId = undefined;
    const parentMessageId = undefined;
    const prompt = `
    We introduce Extreme TLDR generation, a new form of extreme summarization for paragraphs. TLDR generation involves high source compression, removes stop words and summarizes the paragraph whilst retaining meaning. The result is the best possible summary that retains all of the original meaning and context of the paragraph. You should not mention anything about yourself.
    Please use Extreme TLDR generation on the following paragraph, with a max word length of ${max_length || 1000} and minimum word length of ${min_length || 50}:
    
    ${message}
    
    Extreme TLDR:
    `
    let respMessageId;
    let respConvID;
    let reply = '';
    let isFirstProgress = true;

    await this.getCompletion(prompt, conversationId, parentMessageId, (message) => {
        if (isFirstProgress) {
            isFirstProgress = false;
            // console.log(message)
        }
        if (message === '[DONE]') {
            return;
        }
        const token = message.message.content.parts[0];
        reply = token;
    });

    return reply.trim();
}

}

