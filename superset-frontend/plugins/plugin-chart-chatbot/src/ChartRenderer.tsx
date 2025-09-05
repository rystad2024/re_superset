import React from 'react';
import { SuperChart } from '@superset-ui/core';


interface ChatbotRendererProps {
    width: number;
    height: number;
    queriesData: any;
}

export default function ChatbotRenderer({
    width,
    height,
    queriesData,
}: ChatbotRendererProps) {
    return (
        <SuperChart
            chartType="chatbot"
            width={width}
            height={height}
            queriesData={queriesData}
            postTransformProps={({ width, height, queriesData }) => ({
                width,
                height,
                data: queriesData?.[0]?.data || [],
                config: queriesData?.[0]?.config || {},
            })}
            disableErrorBoundary
        />
    );
}
