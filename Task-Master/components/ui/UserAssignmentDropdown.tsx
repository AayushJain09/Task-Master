/**
 * UserAssignmentDropdown Component
 * 
 * A sophisticated dropdown component for selecting users to assign tasks to.
 * Features real-time search, scrollable list, current user option, and 
 * smooth animations with excellent user experience.
 * 
 * Features:
 * - Real-time user search with debounced API calls
 * - Scrollable dropdown list with pagination support
 * - "Assign to myself" option prominently displayed
 * - Keyboard navigation and accessibility support
 * - Loading states and error handling
 * - Theme-aware styling for dark/light modes
 * - Touch-optimized for mobile devices
 * 
 * @module components/ui/UserAssignmentDropdown
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Animated,
  Dimensions
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usersService, UserListItem } from '@/services/users.service';
import { debounce } from '@/utils/debounce';
import {
  ChevronDown,
  ChevronUp,
  Search,
  User,
  UserCheck,
  Users,
  X
} from 'lucide-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserAssignmentDropdownProps {
  selectedUserId?: string; // single select
  selectedUserIds?: string[]; // multi select
  multiple?: boolean;
  onUserSelect?: (userId: string, userName: string) => void;
  onUsersChange?: (userIds: string[], users: UserListItem[]) => void;
  placeholder?: string;
  disabled?: boolean;
  showLabel?: boolean;
  required?: boolean;
}

export const UserAssignmentDropdown: React.FC<UserAssignmentDropdownProps> = ({
  selectedUserId,
  selectedUserIds,
  multiple = false,
  onUserSelect = () => { },
  onUsersChange,
  placeholder = "Select user to assign",
  disabled = false,
  showLabel = true,
  required = false
}) => {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();

  // Component state
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<UserListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Animation and refs
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  // Fixed dropdown height for consistent animations
  const getOptimalDropdownHeight = useCallback(() => {
    // console.log("jhsafgdjyfgsd",SCREEN_HEIGHT * 0.4)
    return Math.min(SCREEN_HEIGHT * 0.4, 450); // Fixed height that's large enough for scrolling
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string, resetList: boolean = true) => {
      if (term.trim().length === 0) {
        // Load all assignable users when no search term
        await loadAllUsers();
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const currentOffset = resetList ? 0 : offset;
        const searchResults = await usersService.searchUsers(term, {
          limit: 10,
          offset: currentOffset
        });
        if (resetList) {
          setUsers(searchResults);
          setOffset(searchResults.length);
          setHasMore(searchResults.length === 10); // Assume more if we got full page
        } else {
          // Append for pagination
          setUsers(prev => [...prev, ...searchResults]);
          setOffset(prev => prev + searchResults.length);
          setHasMore(searchResults.length === 10);
        }
      } catch (err: any) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
        if (resetList) {
          setUsers([]);
          setOffset(0);
          setHasMore(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [offset]
  );

  // Load all assignable users
  const loadAllUsers = useCallback(async (resetList: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = resetList ? 0 : offset;
      const allUsers = await usersService.getAssignableUsers({
        limit: 20,
        offset: currentOffset,
        excludeCurrentUser: false
      });

      if (resetList) {
        setUsers(allUsers);
        setOffset(allUsers.length);
        setHasMore(allUsers.length === 20); // Assume more if we got full page
      } else {
        // Append for pagination
        setUsers(prev => [...prev, ...allUsers]);
        setOffset(prev => prev + allUsers.length);
        setHasMore(allUsers.length === 20);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
      if (resetList) {
        setUsers([]);
        setOffset(0);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    setSearchTerm(text);
    setOffset(0); // Reset pagination when searching
    debouncedSearch(text, true); // Reset list when new search
  }, [debouncedSearch]);

  // Load more users for pagination
  const loadMoreUsers = useCallback(async () => {
    if (isLoading || !hasMore) return;

    if (searchTerm.trim().length > 0) {
      // Continue search with current term
      debouncedSearch(searchTerm, false);
    } else {
      // Load more general users
      await loadAllUsers(false);
    }
  }, [isLoading, hasMore, searchTerm, debouncedSearch, loadAllUsers]);

  // Handle dropdown toggle
  const toggleDropdown = useCallback(() => {
    if (disabled) return;

    if (!isOpen) {
      // Calculate optimal height for animation
      const optimalHeight = getOptimalDropdownHeight();

      // Set state first to prevent flickering
      setIsOpen(true);

      // Load users when opening dropdown if needed
      if (users.length === 0) {
        loadAllUsers();
      }

      // Animate dropdown open with fixed height for scrolling
      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: optimalHeight,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Focus search input after animation
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      });
    } else {
      // Animate dropdown close with smooth transition
      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsOpen(false);
        setSearchTerm('');
        setOffset(0);
        setHasMore(false);
      });
    }
  }, [isOpen, disabled, users.length, loadAllUsers, dropdownHeight, dropdownOpacity, getOptimalDropdownHeight]);

  // Handle "assign to myself" selection
  const handleAssignToMyself = useCallback(() => {
    if (currentUser) {
      const currentUserData: UserListItem = {
        id: currentUser.id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        fullName: currentUser.fullName,
        role: currentUser.role,
        isActive: currentUser.isActive
      };
      handleUserSelect(currentUserData);
    }
  }, [currentUser, handleUserSelect]);

  // Find selected user(s) when props change
  useEffect(() => {
    if (multiple) {
      const ids = selectedUserIds && selectedUserIds.length > 0
        ? selectedUserIds
        : currentUser
          ? [currentUser.id]
          : [];
      setSelectedUsers(prev => {
        if (ids.length === 0) return [];
        // try to hydrate from existing list if available
        const map = new Map(prev.map(u => [u.id, u]));
        const next = ids.map(id => map.get(id)).filter(Boolean) as UserListItem[];
        return next;
      });
      return;
    }
    if (selectedUserId && currentUser && selectedUserId === currentUser.id) {
      setSelectedUser({
        id: currentUser.id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        fullName: currentUser.fullName,
        role: currentUser.role,
        isActive: currentUser.isActive
      });
    } else if (selectedUserId && users.length > 0) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setSelectedUser(user);
      }
    } else if (!selectedUserId) {
      setSelectedUser(null);
    }
  }, [selectedUserId, selectedUserIds, currentUser, users, multiple]);

  // Hydrate selected users when multiple and not yet loaded in list
  useEffect(() => {
    const hydrate = async () => {
      if (!multiple) return;
      const ids = selectedUserIds && selectedUserIds.length > 0 ? selectedUserIds : [];
      const missing = ids.filter(id => !selectedUsers.some(u => u.id === id));
      if (missing.length === 0) return;
      try {
        const fetched = await Promise.all(missing.map(id => usersService.getUserById(id)));
        const filtered = fetched.filter(Boolean) as UserListItem[];
        if (filtered.length > 0) {
          setSelectedUsers(prev => {
            const map = new Map(prev.map(u => [u.id, u]));
            filtered.forEach(u => map.set(u.id, u));
            const combined = ids
              .map(id => map.get(id))
              .filter(Boolean) as UserListItem[];
            onUsersChange?.(combined.map(u => u.id), combined);
            return combined;
          });
        }
      } catch (err) {
        console.warn('Failed to hydrate selected users', err);
      }
    };
    hydrate();
  }, [multiple, selectedUserIds, selectedUsers, onUsersChange]);

  // Handle user selection
  const handleUserSelect = useCallback((user: UserListItem) => {
    if (multiple) {
      setSelectedUsers(prev => {
        const exists = prev.some(u => u.id === user.id);
        const next = exists ? prev.filter(u => u.id !== user.id) : [...prev, user];
        onUsersChange?.(next.map(u => u.id), next);
        return next;
      });
      return;
    }
    setSelectedUser(user);
    onUserSelect(user.id, user.fullName);
    toggleDropdown();
  }, [multiple, onUsersChange, onUserSelect, toggleDropdown]);

  // Get display text for selected user(s)
  const getDisplayText = () => {
    if (multiple) {
      if (selectedUsers.length === 0) return placeholder;
      if (selectedUsers.length === 1) return selectedUsers[0].fullName;
      return `${selectedUsers[0].fullName} +${selectedUsers.length - 1}`;
    }
    if (!selectedUser) return placeholder;
    if (currentUser && selectedUser.id === currentUser.id) {
      return `${selectedUser.fullName} (Me)`;
    }
    return selectedUser.fullName;
  };

  return (
    <View className="w-full">
      {/* Label */}
      {showLabel && (
        <View className="flex-row items-center mb-3">
          <User size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`text-base font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'
            }`}>
            Assign To {required && <Text className="text-red-500">*</Text>}
          </Text>
        </View>
      )}
      {multiple && selectedUsers.length > 0 && (
        <View className="w-full pb-3">
          <View className="flex-row flex-wrap" style={{ gap: 7 }}>
            {selectedUsers.map(user => (
              <View
                key={user.id}
                className={`flex-row items-center px-2 py-1.5 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                  style={{ borderWidth: 1, borderColor: isDark ? '#4B5563' : '#E5E7EB' }}
                >
                  <Text className={`text-xs font-semibold ${isDark ? 'text-gray-100' : 'text-gray-700'}`}>
                    {(user.firstName?.[0] || user.fullName?.[0] || '?').toUpperCase()}
                  </Text>
                </View>
                <Text className={`text-sm mr-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`} numberOfLines={1}>
                  {user.fullName}
                </Text>
                <TouchableOpacity onPress={() => handleUserSelect(user)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <X size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
      {/* Main dropdown button */}
      <Pressable
        onPress={toggleDropdown}
        disabled={disabled}
        style={{
          shadowColor: isDark ? '#000' : '#000',
          shadowOffset: {
            width: 0,
            height: disabled ? 1 : 4,
          },
          shadowOpacity: disabled ? 0.1 : (isDark ? 0.2 : 0.1),
          shadowRadius: disabled ? 1 : 6,
          elevation: disabled ? 1 : 4,
        }}
        className={`
          w-full
          flex-row
          items-center
          justify-between
          p-2
          border
          rounded-xl
          ${disabled
            ? isDark
              ? 'bg-gray-700 border-gray-600'
              : 'bg-gray-100 border-gray-300'
            : isDark
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }
          ${!disabled && isDark ? 'active:bg-gray-700' : !disabled ? 'active:bg-gray-50' : ''}
        `}
      >

        <View className="flex-row items-center flex-1">
          {(!multiple && selectedUser) || (multiple && selectedUsers.length > 0) ? (
            <>
              <View className={`
                w-8
                h-8
                rounded-full
                items-center
                justify-center
                mr-3
                ${isDark ? 'bg-green-500' : 'bg-green-100'}
              `}
                style={{
                  shadowColor: isDark ? '#10B981' : '#10B981',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                  elevation: 2,
                }}>
                <UserCheck size={18} color={isDark ? '#FFFFFF' : '#10B981'} />
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                  {getDisplayText()}
                </Text>
                {!multiple && selectedUser && (
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {selectedUser.email}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <>
              <View className={`
                w-10
                h-10
                rounded-full
                items-center
                justify-center
                mr-3
                ${isDark ? 'bg-gray-600' : 'bg-gray-200'}
              `}>
                <Users size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </View>
              <View className="flex-1">
                <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  {placeholder}
                </Text>
              </View>
            </>
          )}
        </View>

        {!disabled && (
          <View className={`
            w-6
            h-6
            rounded-full
            items-center
            justify-center
            ml-2
            ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
          `}>
            {isOpen ? (
              <ChevronUp size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
            ) : (
              <ChevronDown size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            )}
          </View>
        )}
      </Pressable>

      {/* Animated dropdown */}
      <Animated.View
        style={{
          height: isOpen ? dropdownHeight : 0,
          opacity: isOpen ? dropdownOpacity : 0,
          shadowColor: isDark ? '#000' : '#000',
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: isDark ? 0.3 : 0.15,
          shadowRadius: 12,
          elevation: 10,
        }}
        className={`
          mt-3
          border
          rounded-2xl
          ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
        `}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        {/* Search input */}
        <View className={`p-4 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <View className={`
              flex-row
              items-center
              px-3
              py-2
              border
              rounded-xl
              ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}
            `}>
            <Search size={18} color={isDark ? '#60A5FA' : '#3B82F6'} />
            <TextInput
              ref={searchInputRef}
              value={searchTerm}
              onChangeText={handleSearchChange}
              placeholder="Search users by name or email..."
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              className={`flex-1 ml-3 text-sm ${isDark ? 'text-white' : 'text-gray-900'
                }`}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={isDark ? '#60A5FA' : '#3B82F6'}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => handleSearchChange('')}
                className="p-2 ml-2"
                style={{
                  backgroundColor: isDark ? '#374151' : '#F3F4F6',
                  borderRadius: 8,
                }}
              >
                <X size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Scrollable content with proper height */}
        <View style={{ flex: 1 }}>
          {/* Assign to myself option */}
          {currentUser && (
            <TouchableOpacity
              onPress={handleAssignToMyself}
              className={`
                  flex-row
                  items-center
                  px-4
                  py-3
                  border-b
                  ${isDark ? 'border-gray-600' : 'border-gray-200'}
                  ${isDark ? 'active:bg-blue-500/10' : 'active:bg-blue-50'}
                `}
              style={{
                backgroundColor: isDark ? '#1E293B20' : '#F8FAFC',
              }}
            >
              <View className={`
                  w-10
                  h-10
                  rounded-full
                  items-center
                  justify-center
                  mr-3
                  ${isDark ? 'bg-blue-500' : 'bg-blue-100'}
                `}>
                <UserCheck size={18} color={isDark ? '#FFFFFF' : '#3B82F6'} />
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                  Myself
                </Text>
                <Text className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'
                  }`}>
                  {currentUser.fullName} • {currentUser.email}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Simple scrollable list */}
          <ScrollView
            style={{ flex: 1 }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {/* Loading state */}
            {isLoading && users.length === 0 ? (
              <View className="flex-row items-center justify-center py-8">
                <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
                <Text className={`ml-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  Searching users...
                </Text>
              </View>
            ) : error ? (
              <View className="px-4 py-8">
                <Text className={`text-center text-sm ${isDark ? 'text-red-400' : 'text-red-600'
                  }`}>
                  {error}
                </Text>
              </View>
            ) : users.filter(user => !currentUser || user.id !== currentUser.id).length === 0 ? (
              <View className="px-4 py-8">
                <Text className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  {searchTerm ? 'No users found' : 'No users available'}
                </Text>
              </View>
            ) : (
              <>
                {users.filter(user => !currentUser || user.id !== currentUser.id).map((user, index) => {
                  const isSelected = multiple
                    ? selectedUsers.some(u => u.id === user.id)
                    : selectedUser?.id === user.id;
                  return (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => handleUserSelect(user)}
                      className={`
                        flex-row
                        items-center
                        px-4
                        py-3
                        ${index > 0 ? 'border-t' : ''}
                        ${isDark ? 'border-gray-700' : 'border-gray-100'}
                        ${isDark ? 'active:bg-gray-700' : 'active:bg-gray-50'}
                      `}
                    >
                      <View className={`
                        w-9
                        h-9
                        rounded-full
                        items-center
                        justify-center
                        mr-3
                        ${isDark ? 'bg-gray-600' : 'bg-gray-200'}
                      `}>
                        <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-700'
                          }`}>
                          {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                          {user.fullName}
                        </Text>
                        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          {user.email} • {user.role}
                        </Text>
                      </View>
                      <View className={`
                        w-2
                        h-2
                        rounded-full
                        ${isSelected
                          ? isDark ? 'bg-blue-400' : 'bg-blue-500'
                          : user.isActive
                            ? isDark ? 'bg-green-500' : 'bg-green-500'
                            : isDark ? 'bg-red-500' : 'bg-red-500'}
                      `} />
                    </TouchableOpacity>
                  );
                })}

                {/* Load More button */}
                {hasMore && users.length > 0 && (
                  <TouchableOpacity
                    onPress={loadMoreUsers}
                    disabled={isLoading}
                    className={`
                        flex-row
                        items-center
                        justify-center
                        px-4
                        py-4
                        border-t
                        ${isDark ? 'border-gray-600' : 'border-gray-200'}
                        ${isLoading ? 'opacity-50' : ''}
                        ${isDark ? 'active:bg-gray-700' : 'active:bg-gray-50'}
                      `}
                  >
                    {isLoading ? (
                      <>
                        <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
                        <Text className={`ml-2 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                          Loading more...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Users size={14} color={isDark ? '#60A5FA' : '#3B82F6'} />
                        <Text className={`ml-2 text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                          Load More Users
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
};

export default UserAssignmentDropdown;
