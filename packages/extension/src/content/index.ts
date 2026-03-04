import browser from 'webextension-polyfill';
import {
  type BroadcastMessage,
  BroadcastSchema,
  type IEvents,
} from '~types/messages';
import { busDispatch, busSubscribe } from '~utils/helpers';

chrome.runtime.onMessage.addListener(
  async (message: unknown, _sender, sendResponse) => {
    const result = BroadcastSchema.safeParse(message);
    if (!result.success) {
      return false;
    }

    const data = result.data;

    if (data.type === 'evolu-scan:ping') {
      sendResponse({ pong: true });
      return false;
    }

    if (data.type === 'evolu-scan:page-reload') {
      window.location.reload();
      return false;
    }

    if (data.type === 'evolu-scan:toggle-state') {
      busDispatch<IEvents['evolu-scan:toggle-state']>(
        'evolu-scan:toggle-state',
        {
          topic: 'evolu-scan:toggle-state',
          message: undefined,
        },
      );
      return false;
    }

    return false;
  },
);

const sendMessageToBackground = ({ type, data }: BroadcastMessage) => {
  try {
    return browser.runtime.sendMessage({ type, data });
  } catch {
    return Promise.resolve();
  }
};

busSubscribe<IEvents['evolu-scan:send-to-background']>(
  'evolu-scan:send-to-background',
  (event) => {
    sendMessageToBackground(event.message);
  },
);
