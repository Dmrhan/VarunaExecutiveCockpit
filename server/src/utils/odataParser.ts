
export interface ODataQuery {
    $select?: string;
    $filter?: string;
    $orderby?: string;
    $top?: string;
    $skip?: string;
    $count?: string;
}

export interface SqlQueryParts {
    select: string;
    where: string;
    orderBy: string;
    limit: string;
    offset: string;
    params: any[];
}

export const parseODataToSql = (query: ODataQuery, tableName: string = 'opportunities', defaultOrderBy: string = 'created_at DESC'): SqlQueryParts => {
    let select = '*';
    let where = '';
    let orderBy = defaultOrderBy;
    let limit = '50';
    let offset = '0';
    const params: any[] = [];

    // 1. $select
    if (query.$select && query.$select !== '*') {
        // Map ODATA field names to DB columns if slightly different, 
        // but our schema mostly matches camelCase or snake_case logic.
        // For simplicity, assuming caller passes valid column names or we map common ones.
        // Our DB uses snake_case keys for some, camelCase for others in the CREATE TABLE? 
        // Wait, looking at setup.ts:
        // id, title, customer_name, product, value, stage, probability, owner_id...
        // The API returns JSON which might need mapping if we want strict ODATA.
        // But for this simulation, we assume the client requests DB column names or we map them.
        // Let's implement a simple mapper if needed, but for now pass through.
        select = query.$select.split(',').map(s => s.trim()).join(', ');
    }

    // 2. $filter
    // 2. $filter
    if (query.$filter) {
        let filterStr = query.$filter;
        const newParams: any[] = [];

        // 1. Handle contains(key, 'val') -> key LIKE ?
        const containsRegex = /contains\(([^,]+),\s*'([^']*)'\)/g;
        filterStr = filterStr.replace(containsRegex, (match, key, val) => {
            newParams.push(`%${val}%`);
            return `${key} LIKE ?`;
        });

        // 2. Handle standard operators with string values: key eq 'val'
        filterStr = filterStr.replace(/(\w+)\s+(eq|ne)\s+'([^']*)'/g, (match, key, op, val) => {
            newParams.push(val);
            return `${key} ${op === 'eq' ? '=' : '!='} ?`;
        });

        // 3. Handle standard operators with numeric values: key gt 100
        filterStr = filterStr.replace(/(\w+)\s+(eq|ne|gt|ge|lt|le)\s+(\d+(\.\d+)?)/g, (match, key, op, val) => {
            newParams.push(Number(val));
            const sqlOpMap: Record<string, string> = { eq: '=', ne: '!=', gt: '>', ge: '>=', lt: '<', le: '<=' };
            const sqlOp = sqlOpMap[op];
            return `${key} ${sqlOp} ?`;
        });

        // 4. Logical operators
        filterStr = filterStr.replace(/\s+and\s+/g, ' AND ').replace(/\s+or\s+/g, ' OR ');

        where = `WHERE ${filterStr}`;
        params.push(...newParams);
    }

    // 3. $orderby
    if (query.$orderby) {
        // name desc, value asc
        orderBy = query.$orderby
            .replace(/\s+desc/gi, ' DESC')
            .replace(/\s+asc/gi, ' ASC');
    }

    // 4. $top
    if (query.$top) {
        limit = parseInt(query.$top).toString();
    }

    // 5. $skip
    if (query.$skip) {
        offset = parseInt(query.$skip).toString();
    }

    return { select, where, orderBy, limit, offset, params };
};
