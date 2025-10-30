import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Heart, Share, Calendar } from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Post } from '@/types/api.types';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [posts, setPosts] = useState<Post[]>([]);

  const fetchPosts = useCallback(async () => {
    try {
      // const response = await apiService.getPosts();
      const response = { data: [] };
      setPosts(response.data);
    } catch (error) {
      setError('Error fetching posts');
      console.error('Error fetching posts:', error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const handlePostAction = (action: string, postId: number) => {
    Alert.alert('Action', `${action} post #${postId}`, [{ text: 'OK' }]);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <Card variant="elevated" className="mb-4 mx-4">
      <View className="mb-3">
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
            <Text className="text-white font-bold text-sm">#{item.userId}</Text>
          </View>
          <View className="flex-1">
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              User {item.userId}
            </Text>
            <View className="flex-row items-center">
              <Calendar size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>2 hours ago</Text>
            </View>
          </View>
        </View>

        <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.title}
        </Text>
        <Text className={`text-base leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.body}</Text>
      </View>

      {/* Action Buttons */}
      <View className={`flex-row items-center justify-between pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <TouchableOpacity
          className="flex-row items-center flex-1 justify-center py-2"
          onPress={() => handlePostAction('Like', item.id)}
        >
          <Heart size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text className={`ml-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center flex-1 justify-center py-2"
          onPress={() => handlePostAction('Comment', item.id)}
        >
          <MessageCircle size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text className={`ml-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center flex-1 justify-center py-2"
          onPress={() => handlePostAction('Share', item.id)}
        >
          <Share size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text className={`ml-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (!posts) {
    return <LoadingSpinner fullScreen />;
  }

  if (error && !posts) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center px-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <Text className={`text-xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Unable to load posts
        </Text>
        <Text className={`text-base mb-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {error}
        </Text>
        <Button
          title="Try Again"
          onPress={() => fetchPosts()}
          variant="primary"
        />
      </SafeAreaView>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
    
      {/* Header */}
      <View className={`px-4 py-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}` }>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Welcome back, {user?.firstName || 'User'}! 👋
        </Text>
        <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Here are the latest updates for you
        </Text>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ flex:1, paddingVertical: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-20">
            <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No posts available
            </Text>
            <Text className={`text-base text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Pull down to refresh and check for new posts
            </Text>
          </View>
        )}
      />
    </View>
  );
}
