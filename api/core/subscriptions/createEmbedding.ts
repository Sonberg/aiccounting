import { Subscription } from 'encore.dev/pubsub';
import { createEmbedding } from '../topics';
import { log } from 'console';

new Subscription(createEmbedding, 'process', {
  handler: async () => {
    log('Embedding created');
  },
});
