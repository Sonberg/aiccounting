import { Subscription } from 'encore.dev/pubsub';
import { syncCompleted } from '../topics';
import { createEmbedding } from '../../core/topics';

new Subscription(syncCompleted, 'update-embeddings', {
  handler: async (params) => {
    // TODO: Get completed sync items
    await createEmbedding.publish({});
  },
});
