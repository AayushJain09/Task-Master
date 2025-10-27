/**
 * Common DTO Module
 *
 * This module provides common Data Transfer Objects (DTOs) used across
 * the application for standardized API responses.
 *
 * DTOs ensure:
 * - Consistent response structure across all endpoints
 * - Type safety and validation
 * - Easy maintenance and refactoring
 * - Clear API contracts
 *
 * @module dtos/common
 */

/**
 * Success Response DTO
 *
 * Standardized success response structure for all API endpoints.
 * Ensures consistent response format across the application.
 *
 * @class SuccessResponseDTO
 *
 * @property {boolean} success - Always true for successful responses
 * @property {string} [message] - Optional success message
 * @property {Object} [data] - Optional response data payload
 * @property {Object} [meta] - Optional metadata (pagination, etc.)
 *
 * @example
 * // Basic success response
 * new SuccessResponseDTO('User created successfully', { user: {...} })
 *
 * // Success with pagination
 * new SuccessResponseDTO('Users fetched', { users: [...] }, { pagination: {...} })
 */
class SuccessResponseDTO {
  /**
   * Creates a success response
   *
   * @constructor
   * @param {string} [message] - Success message
   * @param {Object} [data] - Response data
   * @param {Object} [meta] - Additional metadata
   */
  constructor(message, data = null, meta = null) {
    this.success = true;

    if (message) {
      this.message = message;
    }

    if (data !== null) {
      this.data = data;
    }

    if (meta !== null) {
      this.meta = meta;
    }
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    const response = { success: this.success };

    if (this.message) response.message = this.message;
    if (this.data !== undefined) response.data = this.data;
    if (this.meta !== undefined) response.meta = this.meta;

    return response;
  }
}

/**
 * Error Response DTO
 *
 * Standardized error response structure for all API error responses.
 *
 * @class ErrorResponseDTO
 *
 * @property {boolean} success - Always false for error responses
 * @property {string} message - Error message
 * @property {Array<Object>} [errors] - Detailed validation errors
 * @property {string} [stack] - Error stack trace (only in development)
 *
 * @example
 * // Simple error
 * new ErrorResponseDTO('User not found')
 *
 * // Validation errors
 * new ErrorResponseDTO('Validation failed', [
 *   { field: 'email', message: 'Email is required' }
 * ])
 */
class ErrorResponseDTO {
  /**
   * Creates an error response
   *
   * @constructor
   * @param {string} message - Error message
   * @param {Array<Object>} [errors] - Detailed error information
   * @param {string} [stack] - Error stack trace
   */
  constructor(message, errors = null, stack = null) {
    this.success = false;
    this.message = message;

    if (errors && errors.length > 0) {
      this.errors = errors;
    }

    if (stack && process.env.NODE_ENV === 'development') {
      this.stack = stack;
    }
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    const response = {
      success: this.success,
      message: this.message,
    };

    if (this.errors) response.errors = this.errors;
    if (this.stack) response.stack = this.stack;

    return response;
  }
}

/**
 * Pagination Metadata DTO
 *
 * Standardized pagination information for list endpoints.
 * Provides comprehensive pagination details for client-side navigation.
 *
 * @class PaginationDTO
 *
 * @property {number} currentPage - Current page number (1-indexed)
 * @property {number} totalPages - Total number of pages
 * @property {number} totalItems - Total number of items across all pages
 * @property {number} itemsPerPage - Number of items per page (limit)
 * @property {number} itemsOnCurrentPage - Actual items on current page
 * @property {boolean} hasNextPage - Whether there's a next page
 * @property {boolean} hasPrevPage - Whether there's a previous page
 * @property {number|null} nextPage - Next page number or null
 * @property {number|null} prevPage - Previous page number or null
 *
 * @example
 * const pagination = new PaginationDTO(1, 10, 95);
 * // Returns: { currentPage: 1, totalPages: 10, totalItems: 95, ... }
 */
class PaginationDTO {
  /**
   * Creates pagination metadata
   *
   * @constructor
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} totalItems - Total items count
   * @param {number} [itemsOnCurrentPage] - Items on current page (defaults to limit or remaining)
   */
  constructor(page, limit, totalItems, itemsOnCurrentPage = null) {
    this.currentPage = parseInt(page, 10);
    this.totalPages = Math.ceil(totalItems / limit);
    this.totalItems = totalItems;
    this.itemsPerPage = parseInt(limit, 10);
    this.itemsOnCurrentPage = itemsOnCurrentPage !== null ? itemsOnCurrentPage : Math.min(limit, totalItems - (page - 1) * limit);
    this.hasNextPage = this.currentPage < this.totalPages;
    this.hasPrevPage = this.currentPage > 1;
    this.nextPage = this.hasNextPage ? this.currentPage + 1 : null;
    this.prevPage = this.hasPrevPage ? this.currentPage - 1 : null;
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalItems,
      itemsPerPage: this.itemsPerPage,
      itemsOnCurrentPage: this.itemsOnCurrentPage,
      hasNextPage: this.hasNextPage,
      hasPrevPage: this.hasPrevPage,
      nextPage: this.nextPage,
      prevPage: this.prevPage,
    };
  }
}

/**
 * Paginated List Response DTO
 *
 * Combines list data with pagination metadata for standardized
 * paginated responses.
 *
 * @class PaginatedListDTO
 *
 * @property {Array} items - Array of items for current page
 * @property {PaginationDTO} pagination - Pagination metadata
 *
 * @example
 * const users = [...]; // Array of users
 * const paginatedResponse = new PaginatedListDTO(users, 1, 10, 95);
 */
class PaginatedListDTO {
  /**
   * Creates a paginated list response
   *
   * @constructor
   * @param {Array} items - Array of items
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} totalItems - Total items count
   */
  constructor(items, page, limit, totalItems) {
    this.items = items;
    this.pagination = new PaginationDTO(page, limit, totalItems, items.length);
  }

  /**
   * Converts DTO to plain JSON object
   *
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      items: this.items,
      pagination: this.pagination.toJSON(),
    };
  }
}

module.exports = {
  SuccessResponseDTO,
  ErrorResponseDTO,
  PaginationDTO,
  PaginatedListDTO,
};
