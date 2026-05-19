/**
 * Pagination helper middleware
 * Attaches pagination metadata to request object
 */
export function parsePagination(defaults = {}) {
  return (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page) || defaults.page || 1);
    const limit = Math.min(
      defaults.maxLimit || 100,
      Math.max(1, parseInt(req.query.limit) || defaults.limit || 20)
    );
    const offset = (page - 1) * limit;

    req.pagination = {
      page,
      limit,
      offset,
    };

    next();
  };
}

/**
 * Format paginated response
 */
export function paginatedResponse(data, total, pagination) {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Build pagination SQL clauses
 */
export function buildPaginationSql(pagination) {
  return {
    limit: `LIMIT ${pagination.limit}`,
    offset: `OFFSET ${pagination.offset}`,
  };
}

/**
 * Add pagination to an existing query
 */
export async function paginateQuery(pool, baseQuery, params, pagination, countColumn = '*') {
  const countQuery = `SELECT COUNT(*)::int as total FROM (${baseQuery}) as count_query`;
  const countResult = await pool.query(countQuery, params);
  const total = countResult.rows[0].total;

  const dataQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await pool.query(dataQuery, [...params, pagination.limit, pagination.offset]);

  return {
    data: dataResult.rows,
    total,
    pagination,
  };
}
