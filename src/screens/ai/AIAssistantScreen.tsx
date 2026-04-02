/**
 * AIAssistantScreen - REDESIGNED
 *
 * Beautiful AI chat interface with:
 * - Modern header with gradient AI icon
 * - Enhanced status display
 * - Improved chat bubbles
 * - Better input design
 * - Smooth animations
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAI } from '@/services/llm';
import { FEATURE_FLAGS, shouldShowLLMFeatures } from '@/config/featureFlags';
import { getStorageRequirements } from '@/config/llmConfig';
import { ChatMessage as ChatMessageType } from '@/types/llm';
import { useSecurityContext } from '@/hooks/useSecurityContext';
import { useTheme } from '@hooks/useTheme';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import {
  ChatMessage,
  SuggestionChips,
  SecurityStatusCard,
  DEFAULT_SUGGESTIONS,
  getContextualSuggestions,
  Suggestion,
} from '@/components/ai';
import SmallTrailSenseCompanyLogo from '@assets/images/SmallTrailSenseCompanyLogo.png';

const CHAT_STORAGE_KEY = '@trailsense/ai_chat_history';
const MAX_STORED_MESSAGES = 50;

export const AIAssistantScreen: React.FC = () => {
  const { theme, colorScheme } = useTheme();
  const colors = theme.colors;
  const isDark = colorScheme === 'dark';

  // AI context
  const {
    isAvailable,
    isReady,
    isEnabling,
    isGenerating,
    downloadProgress,
    response,
    enableAI,
  } = useAI();

  // Security context
  const securityContext = useSecurityContext();

  // Local state
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const logoSource = SmallTrailSenseCompanyLogo;

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Feature check
  const isFeatureEnabled =
    isAvailable &&
    shouldShowLLMFeatures() &&
    FEATURE_FLAGS.LLM_CONVERSATIONAL_ASSISTANT;
  const modelDownloadSize = getStorageRequirements().formattedTotal;

  // Contextual suggestions
  const contextualSuggestions = useMemo(() => {
    return getContextualSuggestions({
      unreviewedAlerts: securityContext.unreviewedAlerts,
      criticalAlerts: securityContext.criticalAlerts,
      offlineDevices: securityContext.offlineDevices,
      lowBatteryDevices: securityContext.lowBatteryDevices,
    });
  }, [securityContext]);

  const allSuggestions = useMemo(() => {
    const combined = [...contextualSuggestions];
    DEFAULT_SUGGESTIONS.forEach(suggestion => {
      if (!combined.find(s => s.id === suggestion.id)) {
        combined.push(suggestion);
      }
    });
    return combined.slice(0, 6);
  }, [contextualSuggestions]);

  const loadChatHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessageType[];
        setMessages(parsed.slice(-MAX_STORED_MESSAGES));
        setShowSuggestions(parsed.length === 0);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  }, []);

  const saveChatHistory = useCallback(async () => {
    try {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  }, [messages]);

  useEffect(() => {
    void loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      void saveChatHistory();
    }
  }, [messages, saveChatHistory]);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Update streaming response
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

  const handleClearChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handleEnableAI = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await enableAI();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not load the on-device AI model.';
      Alert.alert(
        'Failed to Enable AI',
        message,
        [{ text: 'OK' }]
      );
    }
  }, [enableAI]);

  const handleSendMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText || inputText.trim();
      if (!text || isGenerating) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setInputText('');
      setShowSuggestions(false);
      Keyboard.dismiss();

      const userMessage: ChatMessageType = {
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMessage]);

      const assistantPlaceholder: ChatMessageType = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantPlaceholder]);

      try {
        const llmService = (await import('@/services/llm/LLMService'))
          .llmService;

        const chatResponse = await llmService.chat({
          messages: [...messages.filter(m => m.role !== 'system'), userMessage],
          securityContext: {
            recentAlerts: securityContext.recentAlerts,
            deviceStatus: [],
          },
        });

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

  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleSendMessage(suggestion.query);
    },
    [handleSendMessage]
  );

  const handleCopyMessage = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

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

  // Welcome screen
  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      {/* Security Status */}
      {!securityContext.isLoading && (
        <SecurityStatusCard context={securityContext} />
      )}

      {/* AI Branding */}
      <View style={styles.brandingContainer}>
        <Image
          source={logoSource}
          style={styles.aiIconLarge}
          resizeMode="contain"
        />
        <Text
          variant="largeTitle"
          weight="bold"
          color="label"
          style={styles.brandTitle}
        >
          TrailSense AI
        </Text>
        <Text
          variant="body"
          style={[styles.brandSubtitle, { color: colors.secondaryLabel }]}
        >
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

  // Enable AI prompt
  const renderEnablePrompt = () => (
    <View style={styles.enableContainer}>
      <Image
        source={logoSource}
        style={styles.aiIconLarge}
        resizeMode="contain"
      />

      <Text
        variant="title1"
        weight="bold"
        color="label"
        style={styles.enableTitle}
      >
        Enable TrailSense AI
      </Text>

      <Text
        variant="body"
        style={[styles.enableSubtitle, { color: colors.secondaryLabel }]}
      >
        Download the on-device AI model to enable intelligent security analysis.
      </Text>

      <View
        style={[
          styles.featureList,
          { backgroundColor: colors.secondarySystemBackground },
        ]}
      >
        <View style={styles.featureRow}>
          <Icon
            name="cloud-download-outline"
            size={20}
            color={colors.systemBlue}
          />
          <Text variant="subheadline" color="label" style={{ marginLeft: 12 }}>
            {`~${modelDownloadSize} one-time download`}
          </Text>
        </View>
        <View style={styles.featureRow}>
          <Icon
            name="phone-portrait-outline"
            size={20}
            color={colors.systemGreen}
          />
          <Text variant="subheadline" color="label" style={{ marginLeft: 12 }}>
            Runs 100% on-device
          </Text>
        </View>
        <View style={styles.featureRow}>
          <Icon
            name="shield-checkmark-outline"
            size={20}
            color={colors.systemPurple}
          />
          <Text variant="subheadline" color="label" style={{ marginLeft: 12 }}>
            No data sent to cloud
          </Text>
        </View>
      </View>

      {isEnabling && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.systemGray5 },
            ]}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${downloadProgress * 100}%` },
              ]}
            />
          </View>
          <Text
            variant="caption1"
            style={{ color: colors.secondaryLabel, marginTop: 8 }}
          >
            Downloading... {(downloadProgress * 100).toFixed(0)}%
          </Text>
        </View>
      )}

      <Pressable
        onPress={handleEnableAI}
        disabled={isEnabling}
        style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      >
        <LinearGradient
          colors={isEnabling ? ['#636366', '#8E8E93'] : ['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.enableButton}
        >
          {isEnabling ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="download-outline" size={20} color="#FFFFFF" />
              <Text
                variant="headline"
                weight="semibold"
                style={{ color: '#FFFFFF', marginLeft: 8 }}
              >
                Download & Enable
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );

  // Not available
  const renderNotAvailable = () => (
    <View style={styles.enableContainer}>
      <View
        style={[styles.aiIconLarge, { backgroundColor: colors.systemGray4 }]}
      >
        <Icon name="close" size={36} color={colors.secondaryLabel} />
      </View>
      <Text
        variant="title1"
        weight="bold"
        color="label"
        style={styles.enableTitle}
      >
        AI Not Available
      </Text>
      <Text
        variant="body"
        style={[styles.enableSubtitle, { color: colors.secondaryLabel }]}
      >
        TrailSense AI requires a custom development build with ExecuTorch and
        iOS 17+ or Android 13+.
      </Text>
    </View>
  );

  if (!isFeatureEnabled) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.systemBackground }]}
        edges={['top', 'bottom']}
      >
        {renderNotAvailable()}
      </SafeAreaView>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.systemBackground }]}
        edges={['top', 'bottom']}
      >
        {renderEnablePrompt()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.systemBackground }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <View style={styles.headerLeft}>
            <Image
              source={logoSource}
              style={styles.aiIconSmall}
              resizeMode="contain"
            />
            <View style={styles.headerTitleContainer}>
              <Text variant="headline" weight="semibold" color="label">
                TrailSense AI
              </Text>
              <SecurityStatusCard context={securityContext} compact />
            </View>
          </View>
          <View style={styles.headerRight}>
            {isGenerating && (
              <View style={styles.generatingBadge}>
                <ActivityIndicator size="small" color={colors.systemBlue} />
              </View>
            )}
            {messages.length > 0 && (
              <Pressable
                onPress={handleClearChat}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text variant="subheadline" style={{ color: colors.systemRed }}>
                  Clear
                </Text>
              </Pressable>
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
              ListHeaderComponent={
                <View style={styles.conversationHeader}>
                  <View
                    style={[
                      styles.dateBadge,
                      { backgroundColor: colors.secondarySystemBackground },
                    ]}
                  >
                    <Icon
                      name="calendar-outline"
                      size={12}
                      color={colors.secondaryLabel}
                    />
                    <Text
                      variant="caption2"
                      style={{ color: colors.secondaryLabel, marginLeft: 4 }}
                    >
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              }
            />

            {/* Quick suggestions - Enhanced */}
            {!inputText && messages.length > 0 && !isGenerating && (
              <SuggestionChips
                suggestions={contextualSuggestions.slice(0, 3)}
                onSelect={handleSuggestionSelect}
                compact
              />
            )}
          </>
        )}

        {/* Enhanced Input Area */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.systemBackground },
          ]}
        >
          {/* Subtle top border with gradient */}
          <LinearGradient
            colors={[
              'rgba(74,82,64,0.2)',
              'rgba(184,166,124,0.25)',
              'rgba(74,82,64,0.2)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inputBorderGradient}
          />
          <View style={styles.inputInner}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark
                    ? 'rgba(44, 44, 46, 0.8)'
                    : 'rgba(242, 242, 247, 0.9)',
                  borderColor: inputText.trim()
                    ? 'rgba(74, 82, 64, 0.4)'
                    : 'transparent',
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.label }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about your security..."
                placeholderTextColor={colors.secondaryLabel}
                multiline
                maxLength={500}
                returnKeyType="default"
                editable={!isGenerating}
              />
            </View>
            <Pressable
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isGenerating}
              style={({ pressed }) => [
                styles.sendButtonWrapper,
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
            >
              <LinearGradient
                colors={
                  !inputText.trim() || isGenerating
                    ? [colors.systemGray4, colors.systemGray3]
                    : ['#4A5240', '#3D4536']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButton}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name="arrow-up" size={20} color="#FFFFFF" />
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleContainer: {
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingBadge: {
    padding: 4,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  conversationHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inputContainer: {
    paddingBottom: 4,
  },
  inputBorderGradient: {
    height: 1,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
    minHeight: 22,
  },
  sendButtonWrapper: {
    shadowColor: '#4A5240',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
  },
  brandingContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  aiIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    marginBottom: 8,
  },
  brandSubtitle: {
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
    marginTop: 20,
    marginBottom: 12,
  },
  enableSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featureList: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 220,
  },
});

export default AIAssistantScreen;
