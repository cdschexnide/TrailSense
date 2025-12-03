import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAI } from '@/services/llm';
import { FEATURE_FLAGS, shouldShowLLMFeatures } from '@/config/featureFlags';
import { ChatMessage as ChatMessageType } from '@/types/llm';
import { useSecurityContext } from '@/hooks/useSecurityContext';
import {
  ChatMessage,
  SuggestionChips,
  SecurityStatusCard,
  DEFAULT_SUGGESTIONS,
  getContextualSuggestions,
  Suggestion,
} from '@/components/ai';

const CHAT_STORAGE_KEY = '@trailsense/ai_chat_history';
const MAX_STORED_MESSAGES = 50;

/**
 * AI Assistant Screen
 * Production-grade conversational security assistant for TrailSense
 *
 * Features:
 * - Real-time security context awareness
 * - Smart suggestion chips based on current status
 * - Chat history persistence
 * - Streaming responses
 * - Professional UI/UX
 */
export const AIAssistantScreen: React.FC = () => {
  // AI context
  const {
    isReady,
    isEnabling,
    isGenerating,
    downloadProgress,
    response,
    enableAI,
    error,
  } = useAI();

  // Security context for AI awareness
  const securityContext = useSecurityContext();

  // Local state
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Check if feature is enabled
  const isFeatureEnabled =
    shouldShowLLMFeatures() && FEATURE_FLAGS.LLM_CONVERSATIONAL_ASSISTANT;

  // Generate contextual suggestions based on current security status
  const contextualSuggestions = useMemo(() => {
    return getContextualSuggestions({
      unreviewedAlerts: securityContext.unreviewedAlerts,
      criticalAlerts: securityContext.criticalAlerts,
      offlineDevices: securityContext.offlineDevices,
      lowBatteryDevices: securityContext.lowBatteryDevices,
    });
  }, [securityContext]);

  // Combine contextual and default suggestions
  const allSuggestions = useMemo(() => {
    const combined = [...contextualSuggestions];
    // Add default suggestions not already covered
    DEFAULT_SUGGESTIONS.forEach(suggestion => {
      if (!combined.find(s => s.id === suggestion.id)) {
        combined.push(suggestion);
      }
    });
    return combined.slice(0, 6); // Max 6 suggestions
  }, [contextualSuggestions]);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory();
    }
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Update response in real-time during generation
  useEffect(() => {
    if (isGenerating && response) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant') {
          return [...prev.slice(0, -1), { ...lastMsg, content: response }];
        }
        return prev;
      });
    }
  }, [response, isGenerating]);

  /**
   * Load chat history from AsyncStorage
   */
  const loadChatHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed.slice(-MAX_STORED_MESSAGES));
        setShowSuggestions(parsed.length === 0);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  /**
   * Save chat history to AsyncStorage
   */
  const saveChatHistory = async () => {
    try {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  };

  /**
   * Clear chat history
   */
  const handleClearChat = useCallback(() => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear the conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            setShowSuggestions(true);
            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
          },
        },
      ]
    );
  }, []);

  /**
   * Handle enabling AI
   */
  const handleEnableAI = useCallback(async () => {
    try {
      await enableAI();
    } catch (err) {
      Alert.alert(
        'Failed to Enable AI',
        'Could not load the AI model. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }, [enableAI]);

  /**
   * Send a message to the AI
   */
  const handleSendMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText || inputText.trim();
      if (!text || isGenerating) return;

      // Clear input immediately
      setInputText('');
      setShowSuggestions(false);
      Keyboard.dismiss();

      // Add user message
      const userMessage: ChatMessageType = {
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Add placeholder for assistant response
      const assistantPlaceholder: ChatMessageType = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantPlaceholder]);

      try {
        // Build the prompt with security context
        const contextualPrompt = `
${securityContext.contextString}

USER QUESTION: ${text}

Respond helpfully based on the security context above. Be concise and actionable.
      `.trim();

        // Use the LLM service to chat
        const { chat } = await import('@/services/llm');
        const llmService = (await import('@/services/llm/LLMService'))
          .llmService;

        const chatResponse = await llmService.chat({
          messages: [...messages.filter(m => m.role !== 'system'), userMessage],
          securityContext: {
            recentAlerts: securityContext.recentAlerts,
            deviceStatus: [],
          },
        });

        // Update the last message with final response
        setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = {
            role: 'assistant',
            content:
              chatResponse.message ||
              response ||
              "I apologize, but I couldn't generate a response. Please try again.",
            timestamp: Date.now(),
          };
          return updatedMessages;
        });
      } catch (err) {
        console.error('Chat error:', err);
        // Update with error message
        setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = {
            role: 'assistant',
            content:
              'I encountered an error processing your request. Please try again.',
            timestamp: Date.now(),
          };
          return updatedMessages;
        });
      }
    },
    [inputText, messages, isGenerating, securityContext, response]
  );

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      handleSendMessage(suggestion.query);
    },
    [handleSendMessage]
  );

  /**
   * Handle message copy
   */
  const handleCopyMessage = useCallback((text: string) => {
    // Could show a toast here
    console.log('Copied to clipboard');
  }, []);

  /**
   * Handle feedback
   */
  const handleFeedback = useCallback((positive: boolean) => {
    // Track feedback for analytics
    console.log('Feedback:', positive ? 'positive' : 'negative');
  }, []);

  /**
   * Render a single message
   */
  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessageType; index: number }) => {
      const isLastMessage = index === messages.length - 1;
      const isStreaming =
        isGenerating && isLastMessage && item.role === 'assistant';

      return (
        <ChatMessage
          message={item}
          isStreaming={isStreaming}
          onCopy={handleCopyMessage}
          onFeedback={handleFeedback}
          showFeedback={!isStreaming && item.role === 'assistant'}
        />
      );
    },
    [messages.length, isGenerating, handleCopyMessage, handleFeedback]
  );

  /**
   * Render welcome screen
   */
  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      {/* Security Status */}
      {!securityContext.isLoading && (
        <SecurityStatusCard context={securityContext} />
      )}

      {/* Welcome Message */}
      <View style={styles.welcomeContent}>
        <View style={styles.aiIconLarge}>
          <Text style={styles.aiIconText}>AI</Text>
        </View>
        <Text style={styles.welcomeTitle}>TrailSense AI</Text>
        <Text style={styles.welcomeSubtitle}>
          Your on-device security assistant. Ask about alerts, detection
          patterns, sensor status, and more.
        </Text>
      </View>

      {/* Suggestions */}
      <SuggestionChips
        suggestions={allSuggestions}
        onSelect={handleSuggestionSelect}
        title="Try asking"
      />
    </View>
  );

  /**
   * Render enable AI prompt
   */
  const renderEnablePrompt = () => (
    <View style={styles.enableContainer}>
      <View style={styles.aiIconLarge}>
        <Text style={styles.aiIconText}>AI</Text>
      </View>
      <Text style={styles.enableTitle}>Enable TrailSense AI</Text>
      <Text style={styles.enableSubtitle}>
        Download the on-device AI model to enable intelligent security analysis.
        {'\n\n'}
        <Text style={styles.enableNote}>
          ~400MB one-time download{'\n'}
          Runs 100% on-device{'\n'}
          No data sent to cloud
        </Text>
      </Text>

      {isEnabling && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${downloadProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Downloading... {(downloadProgress * 100).toFixed(0)}%
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.enableButton, isEnabling && styles.enableButtonDisabled]}
        onPress={handleEnableAI}
        disabled={isEnabling}
      >
        {isEnabling ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.enableButtonText}>Download & Enable</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  /**
   * Render not available message
   */
  const renderNotAvailable = () => (
    <View style={styles.enableContainer}>
      <Text style={styles.enableTitle}>AI Not Available</Text>
      <Text style={styles.enableSubtitle}>
        The AI assistant feature is not available on your device or has been
        disabled.
      </Text>
    </View>
  );

  // Feature not enabled
  if (!isFeatureEnabled) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderNotAvailable()}
      </SafeAreaView>
    );
  }

  // AI not ready
  if (!isReady) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderEnablePrompt()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIconSmall}>
              <Text style={styles.aiIconTextSmall}>AI</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>TrailSense AI</Text>
              <SecurityStatusCard context={securityContext} compact />
            </View>
          </View>
          <View style={styles.headerRight}>
            {isGenerating && (
              <ActivityIndicator
                size="small"
                color="#007AFF"
                style={styles.headerLoader}
              />
            )}
            {messages.length > 0 && (
              <TouchableOpacity
                onPress={handleClearChat}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Messages or Welcome */}
        {messages.length === 0 && showSuggestions ? (
          renderWelcome()
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              style={styles.messageList}
              data={messages}
              keyExtractor={(item, index) => `${item.timestamp}-${index}`}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageListContent}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              showsVerticalScrollIndicator={false}
            />

            {/* Quick suggestions when not typing */}
            {!inputText && messages.length > 0 && !isGenerating && (
              <SuggestionChips
                suggestions={contextualSuggestions.slice(0, 3)}
                onSelect={handleSuggestionSelect}
                compact
              />
            )}
          </>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your security..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={500}
              returnKeyType="default"
              editable={!isGenerating}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isGenerating) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiIconTextSmall: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerLoader: {
    marginRight: 12,
  },
  clearButton: {
    fontSize: 15,
    color: '#FF3B30',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    minHeight: 24,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#38383A',
  },
  sendButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  aiIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  enableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  enableTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  enableSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  enableNote: {
    fontSize: 14,
    color: '#8E8E93',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1C1C1E',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  enableButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  enableButtonDisabled: {
    backgroundColor: '#38383A',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default AIAssistantScreen;
