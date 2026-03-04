import { z } from 'zod';

export const BroadcastSchema = z.object({
  type: z.enum([
    'evolu-scan:ping',
    'evolu-scan:is-enabled',
    'evolu-scan:toggle-state',
    'evolu-scan:page-reload',
  ]),
  data: z.any().optional(),
});

export type BroadcastMessage = z.infer<typeof BroadcastSchema>;

export interface IEvents {
  'evolu-scan:toggle-state': {
    topic: 'evolu-scan:toggle-state';
    message: undefined;
  };
  'evolu-scan:send-to-background': {
    topic: 'evolu-scan:send-to-background';
    message: BroadcastMessage;
  };
}
