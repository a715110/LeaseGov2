/**
 * Pagination parameters and result metadata.
 */
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginationInput {
  page?: number
  pageSize?: number
}
