import { QueryFormData, buildQueryContext } from '@superset-ui/core';

export default function buildQuery(formData: QueryFormData) {
    // Return minimal query - the backend will handle providing dummy data
    return buildQueryContext(formData, (buildQuery) => [{
        // Minimal query configuration since we're not using real data
        ...buildQuery,
        columns: [],
        metrics: [],
        filters: [],
        extras: {},
        orderby: [],
        row_limit: 1,
    }]);
}