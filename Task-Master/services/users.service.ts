/**
 * User Service
 * 
 * Handles all user-related API operations including fetching user lists,
 * user profiles, and user search functionality for task assignments.
 * 
 * @module services/users.service
 */

import { apiService } from './api.service';
import { User } from '@/types/auth.types';

/**
 * User search and assignment interfaces
 */
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
}

export interface UserSearchParams {
  search?: string;
  limit?: number;
  offset?: number;
  excludeCurrentUser?: boolean;
}

export interface UserSearchResponse {
  users: UserListItem[];
  total: number;
  hasMore: boolean;
}

class UsersService {
  /**
   * Fetch all active users for task assignment
   * @param params Search parameters
   * @returns Promise with user list and pagination info
   */
  async getUsers(params: UserSearchParams = {}): Promise<UserSearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.offset) {
        queryParams.append('offset', params.offset.toString());
      }
      if (params.excludeCurrentUser) {
        queryParams.append('excludeCurrentUser', 'true');
      }

      const url = `/users/assignable${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiService.get<{users: UserListItem[], total: number, hasMore: boolean}>(url);
      
      // API service already extracts data from wrapper, so response should have the users data directly
      return {
        users: response.users || [],
        total: response.total || 0,
        hasMore: response.hasMore || false
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   * @param searchTerm Search term
   * @param options Search options including pagination
   * @returns Promise with filtered user list
   */
  async searchUsers(searchTerm: string, options: { limit?: number, offset?: number } = {}): Promise<UserListItem[]> {
    try {
      const response = await this.getUsers({
        search: searchTerm,
        limit: options.limit || 10,
        offset: options.offset || 0,
        excludeCurrentUser: false
      });
      
      return response.users;
    } catch (error) {
      console.error('Error searching users:', error);
      // Return empty array on error to prevent UI breaks
      return [];
    }
  }

  /**
   * Get user by ID (limited info for assignment purposes)
   * @param userId User ID
   * @returns Promise with user data
   */
  async getUserById(userId: string): Promise<UserListItem | null> {
    try {
      // For user assignment, we can search for the specific user
      // This provides consistent data format with limited fields
      const response = await this.getUsers({ search: userId, limit: 1 });
      
      if (response.users.length === 0) {
        return null;
      }
      
      return response.users[0];
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Get assignable users (active users who can be assigned tasks)
   * @param options Optional parameters for pagination and filtering
   * @returns Promise with list of assignable users
   */
  async getAssignableUsers(options: { limit?: number, offset?: number, excludeCurrentUser?: boolean } = {}): Promise<UserListItem[]> {
    try {
      const response = await this.getUsers({
        excludeCurrentUser: options.excludeCurrentUser || false,
        limit: options.limit || 50, // Default to reasonable limit
        offset: options.offset || 0
      });
      
      // API already filters for active users, so we can return directly
      return response.users;
    } catch (error) {
      console.error('Error fetching assignable users:', error);
      // Return empty array on error to prevent UI breaks
      return [];
    }
  }
}

export const usersService = new UsersService();
