export default function transformProps(chartProps: any) {
  const { width, height, queriesData } = chartProps;
  const payload = queriesData?.[0] || {};
  return {
    width,
    height,
    data: payload.data || [],
    config: payload.config || { widget_type: 'chatbot', api_url: 'http://localhost:8000', api_key_configured: true },
  };
}
