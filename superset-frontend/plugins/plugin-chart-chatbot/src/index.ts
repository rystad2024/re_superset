import { ChartPlugin, ChartMetadata } from '@superset-ui/core';
import transformProps from './transformProps';
import controlPanel from './controlPanel';

export default class ChatBotPlugin extends ChartPlugin {
    constructor() {
        super({
            controlPanel,
            metadata: new ChartMetadata({
                name: 'Chatbot',
                description: 'Interactive chatbot widget',
                thumbnail: '',
                useLegacyApi: true,
                category: 'Other',
                tags: ['AI'],
                datasourceCount: 0,
                queryObjectCount: 0,
            }),
            loadChart: () => import('./ChatbotWidget'),
            transformProps,
        });
    }
}
