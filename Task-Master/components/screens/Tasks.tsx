import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert,
  Dimensions
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { 
  Plus,
  Calendar,
  X,
  Edit3,
  Trash2,
  GripVertical
} from 'lucide-react-native';
import Card from '../ui/Card';
import { 
  Gesture, 
  GestureDetector,
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Task interface for type safety
 */
interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string;
  category: string;
  createdAt: string;
}

/**
 * Column status type
 */
type ColumnStatus = 'todo' | 'in_progress' | 'done';

/**
 * Main Tasks component with working drag and drop kanban board
 */
export default function Tasks() {
  const { isDark } = useTheme();
  
  // Task data state
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Design new landing page',
      description: 'Create wireframes and mockups for the new landing page',
      priority: 'high',
      status: 'todo',
      dueDate: 'Today',
      category: 'Design',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      title: 'Review pull requests',
      description: 'Review and approve pending pull requests',
      priority: 'medium',
      status: 'in_progress',
      dueDate: 'Today',
      category: 'Development',
      createdAt: '2024-01-15'
    },
    {
      id: 3,
      title: 'Update documentation',
      description: 'Update API documentation with new endpoints',
      priority: 'low',
      status: 'done',
      dueDate: 'Yesterday',
      category: 'Documentation',
      createdAt: '2024-01-14'
    }
  ]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    category: '',
    dueDate: 'Today'
  });

  // Drag state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dropZone, setDropZone] = useState<ColumnStatus | null>(null);

  /**
   * Get color scheme for priority levels
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      case 'medium':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FED7AA' };
      case 'low':
        return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
      default:
        return { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' };
    }
  };

  /**
   * Get tasks by status for column rendering
   */
  const getTasksByStatus = useCallback((status: ColumnStatus) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  /**
   * Handle task creation
   */
  const handleCreateTask = useCallback(() => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: 'todo',
      category: formData.category.trim() || 'General',
      dueDate: formData.dueDate,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTasks(prev => [...prev, newTask]);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      dueDate: 'Today'
    });
    setShowCreateModal(false);
  }, [formData]);

  /**
   * Handle task editing
   */
  const handleEditTask = useCallback(() => {
    if (!selectedTask || !formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setTasks(prev => prev.map(task => 
      task.id === selectedTask.id 
        ? {
            ...task,
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            category: formData.category.trim() || 'General',
            dueDate: formData.dueDate
          }
        : task
    ));

    setShowEditModal(false);
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      dueDate: 'Today'
    });
  }, [selectedTask, formData]);

  /**
   * Handle task deletion
   */
  const handleDeleteTask = useCallback((taskId: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setTasks(prev => prev.filter(task => task.id !== taskId))
        }
      ]
    );
  }, []);

  /**
   * Move task to new status
   */
  const moveTask = useCallback((taskId: number, newStatus: ColumnStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  }, []);

  /**
   * Open edit modal with task data
   */
  const openEditModal = useCallback((task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate
    });
    setShowEditModal(true);
  }, []);

  /**
   * Draggable Task Card Component
   */
  const DraggableTask = ({ task }: { task: Task }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const zIndex = useSharedValue(1);

    const priorityColors = getPriorityColor(task.priority);

    const panGesture = Gesture.Pan()
      .onStart(() => {
        'worklet';
        runOnJS(setDraggedTask)(task);
        scale.value = withSpring(1.1);
        opacity.value = withTiming(0.8);
        zIndex.value = 1000;
      })
      .onUpdate((event) => {
        'worklet';
        translateX.value = event.translationX;
        translateY.value = event.translationY;

        // Determine drop zone based on horizontal position
        const screenThird = SCREEN_WIDTH / 3;
        const currentX = event.absoluteX;
        
        if (currentX < screenThird) {
          runOnJS(setDropZone)('todo');
        } else if (currentX < screenThird * 2) {
          runOnJS(setDropZone)('in_progress');
        } else {
          runOnJS(setDropZone)('done');
        }
      })
      .onEnd(() => {
        'worklet';
        
        // Reset animations
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
        zIndex.value = 1;

        // Handle drop
        runOnJS((currentDropZone: ColumnStatus | null) => {
          if (currentDropZone && currentDropZone !== task.status) {
            moveTask(task.id, currentDropZone);
          }
          setDraggedTask(null);
          setDropZone(null);
        })(dropZone);
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
      elevation: draggedTask?.id === task.id ? 10 : 2,
    }));

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <View 
            className={`mb-3 p-4 rounded-xl ${
              draggedTask?.id === task.id
                ? isDark 
                  ? 'bg-gray-700 border-2 border-blue-400 shadow-lg' 
                  : 'bg-blue-50 border-2 border-blue-400 shadow-lg'
                : isDark 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200 shadow-sm'
            }`}
          >
            {/* Task Header */}
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text className={`font-semibold text-sm leading-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.title}
                </Text>
                {task.description && (
                  <Text className={`text-xs mt-1 leading-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {task.description}
                  </Text>
                )}
              </View>
              
              {/* Drag Handle */}
              <TouchableOpacity className="p-1">
                <GripVertical size={14} color={isDark ? '#6B7280' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {/* Task Meta */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center space-x-2">
                {/* Priority Badge */}
                <View 
                  className="px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: priorityColors.bg }}
                >
                  <Text 
                    className="text-xs font-medium"
                    style={{ color: priorityColors.text }}
                  >
                    {task.priority.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Category */}
                <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {task.category}
                </Text>
              </View>

              {/* Due Date */}
              <View className="flex-row items-center">
                <Calendar size={10} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {task.dueDate}
                </Text>
              </View>
            </View>

            {/* Task Actions */}
            <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <View className="flex-row items-center space-x-1">
                {/* Quick Move Buttons */}
                {task.status !== 'todo' && (
                  <TouchableOpacity 
                    onPress={() => moveTask(task.id, 'todo')}
                    className="px-2 py-1 rounded-md bg-red-50 border border-red-200"
                  >
                    <Text className="text-xs font-medium text-red-600">ToDo</Text>
                  </TouchableOpacity>
                )}
                {task.status !== 'in_progress' && (
                  <TouchableOpacity 
                    onPress={() => moveTask(task.id, 'in_progress')}
                    className="px-2 py-1 rounded-md bg-yellow-50 border border-yellow-200"
                  >
                    <Text className="text-xs font-medium text-yellow-600">Progress</Text>
                  </TouchableOpacity>
                )}
                {task.status !== 'done' && (
                  <TouchableOpacity 
                    onPress={() => moveTask(task.id, 'done')}
                    className="px-2 py-1 rounded-md bg-green-50 border border-green-200"
                  >
                    <Text className="text-xs font-medium text-green-600">Done</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Edit/Delete Actions */}
              <View className="flex-row items-center space-x-1">
                <TouchableOpacity 
                  onPress={() => openEditModal(task)}
                  className={`p-1.5 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <Edit3 size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-md bg-red-50"
                >
                  <Trash2 size={12} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    );
  };

  /**
   * Kanban Column Component
   */
  const KanbanColumn = ({ 
    status, 
    title, 
    color 
  }: { 
    status: ColumnStatus; 
    title: string; 
    color: string; 
  }) => {
    const tasks = getTasksByStatus(status);
    const isDropTarget = dropZone === status;

    return (
      <View 
        style={{ width: 280, minHeight: 600 }}
        className={`rounded-xl ${
          isDropTarget 
            ? isDark 
              ? 'bg-blue-900/20 border-2 border-blue-400 border-dashed' 
              : 'bg-blue-50 border-2 border-blue-300 border-dashed'
            : isDark 
              ? 'bg-gray-800/80' 
              : 'bg-white'
        }`}
      >
        {/* Column Header */}
        <View className="px-4 py-5 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-3" 
                style={{ backgroundColor: color }} 
              />
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </Text>
            </View>
            <View 
              className={`px-2 py-1 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {tasks.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Column Content */}
        <View className="flex-1 p-3">
          {/* Drop Zone Indicator */}
          {isDropTarget && draggedTask && (
            <View 
              className={`mb-3 p-4 border-2 border-dashed rounded-lg ${
                isDark 
                  ? 'border-blue-400 bg-blue-900/30' 
                  : 'border-blue-400 bg-blue-100'
              }`}
            >
              <Text className={`text-center text-sm font-medium ${
                isDark ? 'text-blue-300' : 'text-blue-600'
              }`}>
                💧 Drop here
              </Text>
            </View>
          )}

          {/* Tasks */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {tasks.map(task => (
              <DraggableTask key={task.id} task={task} />
            ))}
            
            {/* Empty State */}
            {tasks.length === 0 && !isDropTarget && (
              <View className={`p-8 rounded-lg border border-dashed ${
                isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'
              }`}>
                <Text className={`text-center text-sm ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  No tasks yet
                </Text>
                <Text className={`text-center text-xs mt-1 ${
                  isDark ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  Drag tasks here
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  /**
   * Task Form Modal Component
   */
  const TaskFormModal = ({ 
    visible, 
    onClose, 
    onSubmit, 
    title: modalTitle 
  }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: () => void;
    title: string;
  }) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View 
          className={`rounded-t-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{ maxHeight: '80%' }}
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {modalTitle}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title Field */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Title *
              </Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="Enter task title"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                className={`border rounded-lg px-3 py-3 ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
            </View>

            {/* Description Field */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter task description"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                multiline
                numberOfLines={3}
                className={`border rounded-lg px-3 py-3 ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Priority Selection */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Priority
              </Text>
              <View className="flex-row space-x-3">
                {(['high', 'medium', 'low'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => setFormData(prev => ({ ...prev, priority }))}
                    className={`flex-1 py-3 rounded-lg border ${
                      formData.priority === priority
                        ? 'border-blue-500 bg-blue-50'
                        : isDark 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Text className={`text-center font-medium ${
                      formData.priority === priority
                        ? 'text-blue-600'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Field */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Category
              </Text>
              <TextInput
                value={formData.category}
                onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                placeholder="Enter category (e.g., Work, Personal)"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                className={`border rounded-lg px-3 py-3 ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
            </View>

            {/* Due Date Selection */}
            <View className="mb-6">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Due Date
              </Text>
              <View className="flex-row space-x-2">
                {['Today', 'Tomorrow', 'This week', 'Next week'].map((date) => (
                  <TouchableOpacity
                    key={date}
                    onPress={() => setFormData(prev => ({ ...prev, dueDate: date }))}
                    className={`flex-1 py-2 rounded-lg border ${
                      formData.dueDate === date
                        ? 'border-blue-500 bg-blue-50'
                        : isDark 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Text className={`text-center text-xs font-medium ${
                      formData.dueDate === date
                        ? 'text-blue-600'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {date}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={onClose}
                className={`flex-1 py-3 rounded-lg border ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                }`}
              >
                <Text className={`text-center font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSubmit}
                className="flex-1 py-3 bg-blue-500 rounded-lg"
              >
                <Text className="text-center font-medium text-white">
                  {modalTitle.includes('Create') ? 'Create Task' : 'Update Task'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Kanban Board
            </Text>
            <TouchableOpacity 
              onPress={() => setShowCreateModal(true)}
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center"
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-row mb-6 space-x-3">
            <Card variant="elevated" className="flex-1 p-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getTasksByStatus('todo').length}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                To Do
              </Text>
            </Card>
            <Card variant="elevated" className="flex-1 p-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getTasksByStatus('in_progress').length}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                In Progress
              </Text>
            </Card>
            <Card variant="elevated" className="flex-1 p-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getTasksByStatus('done').length}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Done
              </Text>
            </Card>
          </View>

          {/* Kanban Board */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
            style={{ marginHorizontal: -16 }}
          >
            <View className="flex-row" style={{ gap: 16, paddingHorizontal: 12 }}>
              <KanbanColumn status="todo" title="To Do" color="#EF4444" />
              <KanbanColumn status="in_progress" title="In Progress" color="#F59E0B" />
              <KanbanColumn status="done" title="Done" color="#10B981" />
            </View>
          </ScrollView>
        </ScrollView>

        {/* Create Task Modal */}
        <TaskFormModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          title="Create New Task"
        />

        {/* Edit Task Modal */}
        <TaskFormModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditTask}
          title="Edit Task"
        />
      </View>
    </GestureHandlerRootView>
  );
}