import { Subscription } from 'encore.dev/pubsub';
import { createEmbedding } from '../topics';
import { log } from 'console';

new Subscription(createEmbedding, 'create-embedding', {
  handler: async () => {
    log('Embedding created');
  },
});
