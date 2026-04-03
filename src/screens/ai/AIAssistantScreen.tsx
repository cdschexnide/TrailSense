/**
 * AIAssistantScreen — Tactical Redesign
 *
 * Amber tactical security briefing interface with:
 * - Compact tactical header with threat status dot
 * - Rich response cards via CardRouter
 * - Terminal-style command input
 * - Tactical quick-action buttons
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
  ScrollView,
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
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAI } from '@/services/llm';
import { FEATURE_FLAGS, shouldShowLLMFeatures } from '@/config/featureFlags';
import { getStorageRequirements } from '@/config/llmConfig';
import { ChatMessage as ChatMessageType } from '@/types/llm';
import { useSecurityContext } from '@/hooks/useSecurityContext';
import { useAlerts } from '@/hooks/api/useAlerts';
import { useDevices } from '@/hooks/api/useDevices';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import {
  ChatMessage,
  SuggestionChips,
  DEFAULT_SUGGESTIONS,
  getContextualSuggestions,
  Suggestion,
} from '@/components/ai';
import {
  tacticalColors as c,
  tacticalTypography as t,
} from '@/constants/tacticalTheme';
import SmallTrailSenseCompanyLogo from '@assets/images/SmallTrailSenseCompanyLogo.png';

const CHAT_STORAGE_KEY = '@trailsense/ai_chat_history';
const MAX_STORED_MESSAGES = 50;

export const AIAssistantScreen: React.FC = () => {
  // AI context
  const {
    isAvailable,
    isReady,
    isEnabling,
    isGenerating,
    downloadProgress,
    enableAI,
  } = useAI();

  // Security context
  const securityContext = useSecurityContext();
  const { data: alerts = [] } = useAlerts({});
  const { data: devices = [] } = useDevices();

  // Local state
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Refs
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Feature check
  const isFeatureEnabled =
    isAvailable &&
    shouldShowLLMFeatures() &&
    FEATURE_FLAGS.LLM_CONVERSATIONAL_ASSISTANT;
  const modelDownloadSize = getStorageRequirements().formattedTotal;

  // Threat status for header dot
  const threatStatus = useMemo(() => {
    if (securityContext.criticalAlerts > 0)
      return { color: c.accentDanger, label: 'CRITICAL' };
    if (
      securityContext.totalAlerts > 0 &&
      securityContext.unreviewedAlerts > 0
    )
      return { color: c.accentWarning, label: 'ELEVATED' };
    return { color: c.accentSuccess, label: 'READY' };
  }, [securityContext]);

  // Suggestions
  const contextualSuggestions = useMemo(
    () =>
      getContextualSuggestions({
        unreviewedAlerts: securityContext.unreviewedAlerts,
        criticalAlerts: securityContext.criticalAlerts,
        offlineDevices: securityContext.offlineDevices,
        lowBatteryDevices: securityContext.lowBatteryDevices,
      }),
    [securityContext]
  );

  const allSuggestions = useMemo(() => {
    const combined = [...contextualSuggestions];
    DEFAULT_SUGGESTIONS.forEach(s => {
      if (!combined.find(c => c.id === s.id)) combined.push(s);
    });
    return combined.slice(0, 6);
  }, [contextualSuggestions]);

  // Persistence
  const loadChatHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessageType[];
        setMessages(parsed.slice(-MAX_STORED_MESSAGES));
        setShowSuggestions(parsed.length === 0);
      }
    } catch {
      // Silently ignore load failures
    }
  }, []);

  const saveChatHistory = useCallback(async () => {
    try {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Silently ignore save failures
    }
  }, [messages]);

  useEffect(() => {
    void loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    if (messages.length > 0) void saveChatHistory();
  }, [messages, saveChatHistory]);

  // Auto-scroll when a new message is added
  const prevMessageCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: true }),
        200
      );
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Handlers
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
      Alert.alert('Failed to Enable AI', message, [{ text: 'OK' }]);
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

      // Placeholder with empty content triggers typing indicator
      const placeholder: ChatMessageType = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, placeholder]);

      try {
        const llmService = (await import('@/services/llm/LLMService'))
          .llmService;

        const chatResponse = await llmService.chat({
          messages: [
            ...messages.filter(m => m.role !== 'system'),
            userMessage,
          ],
          rawAlerts: alerts,
          rawDevices: devices,
        });

        // Replace placeholder with full response including structuredData
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content:
              chatResponse.message ||
              "I couldn't generate a response. Please try again.",
            timestamp: Date.now(),
            intent: chatResponse.intent,
            structuredData: chatResponse.structuredData,
          };
          return updated;
        });
      } catch {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content:
              'I encountered an error processing your request. Please try again.',
            timestamp: Date.now(),
          };
          return updated;
        });
      }
    },
    [alerts, devices, inputText, isGenerating, messages]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleSendMessage(suggestion.query);
    },
    [handleSendMessage]
  );


  // ── Welcome screen ──────────────────────────────────
  const renderWelcome = () => (
    <ScrollView
      style={styles.welcomeContainer}
      contentContainerStyle={styles.welcomeContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.welcomeBranding}>
        <Image
          source={SmallTrailSenseCompanyLogo}
          style={styles.welcomeLogo}
          resizeMode="contain"
        />
        <Text style={styles.welcomeTitle}>TRAILSENSE AI</Text>
        <Text style={styles.welcomeSubtitle}>
          Your on-device security analyst
        </Text>
      </View>

      <SuggestionChips
        suggestions={allSuggestions}
        onSelect={handleSuggestionSelect}
      />
    </ScrollView>
  );

  // ── Enable prompt (unchanged in structure, tactical colors) ──
  const renderEnablePrompt = () => (
    <View style={styles.enableContainer}>
      <Image
        source={SmallTrailSenseCompanyLogo}
        style={styles.enableLogo}
        resizeMode="contain"
      />
      <Text style={styles.enableTitle}>Enable TrailSense AI</Text>
      <Text style={styles.enableSubtitle}>
        Download the on-device AI model to enable intelligent security
        analysis.
      </Text>

      <View style={styles.featureList}>
        <View style={styles.featureRow}>
          <Icon name="cloud-download-outline" size={20} color={c.accentPrimary} />
          <Text style={styles.featureText}>
            {`~${modelDownloadSize} one-time download`}
          </Text>
        </View>
        <View style={styles.featureRow}>
          <Icon name="phone-portrait-outline" size={20} color={c.accentSuccess} />
          <Text style={styles.featureText}>Runs 100% on-device</Text>
        </View>
        <View style={styles.featureRow}>
          <Icon name="shield-checkmark-outline" size={20} color={c.accentPrimary} />
          <Text style={styles.featureText}>No data sent to cloud</Text>
        </View>
      </View>

      {isEnabling && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${downloadProgress * 100}%`,
                  backgroundColor: c.accentPrimary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Downloading... {(downloadProgress * 100).toFixed(0)}%
          </Text>
        </View>
      )}

      <Pressable
        onPress={handleEnableAI}
        disabled={isEnabling}
        style={({ pressed }) => [
          styles.enableButton,
          isEnabling && { opacity: 0.6 },
          pressed && { opacity: 0.8 },
        ]}
      >
        {isEnabling ? (
          <ActivityIndicator size="small" color={c.textPrimary} />
        ) : (
          <>
            <Icon name="download-outline" size={20} color={c.textPrimary} />
            <Text style={styles.enableButtonText}>Download & Enable</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  // ── Not available ───────────────────────────────────
  const renderNotAvailable = () => (
    <View style={styles.enableContainer}>
      <View style={styles.notAvailableIcon}>
        <Icon name="close" size={36} color={c.textTertiary} />
      </View>
      <Text style={styles.enableTitle}>AI Not Available</Text>
      <Text style={styles.enableSubtitle}>
        TrailSense AI requires a custom development build with ExecuTorch
        and iOS 17+ or Android 13+.
      </Text>
    </View>
  );

  if (!isFeatureEnabled) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderNotAvailable()}
      </SafeAreaView>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderEnablePrompt()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Tactical Header ──────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Image
                source={SmallTrailSenseCompanyLogo}
                style={styles.headerIconImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.headerTitle}>TRAILSENSE AI</Text>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: threatStatus.color },
              ]}
            />
            <Text
              style={[styles.statusLabel, { color: threatStatus.color }]}
            >
              {threatStatus.label}
            </Text>
            {messages.length > 0 && (
              <Pressable
                onPress={handleClearChat}
                style={styles.clearBtn}
                hitSlop={10}
              >
                <Text style={styles.clearText}>CLEAR</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Content area ── */}
        {messages.length === 0 && showSuggestions ? (
          renderWelcome()
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((item, index) => {
              const isLastMessage = index === messages.length - 1;
              const isStreamingMsg =
                isGenerating && isLastMessage && item.role === 'assistant';
              return (
                <ChatMessage
                  key={`${item.timestamp}-${index}`}
                  message={item}
                  isStreaming={isStreamingMsg}
                  onCopy={() =>
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    )
                  }
                  onFeedback={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                  showFeedback={
                    !isStreamingMsg && item.role === 'assistant'
                  }
                />
              );
            })}
          </ScrollView>
        )}

        {/* ── Quick actions (pinned above input) ── */}
        {messages.length > 0 && !inputText && !isGenerating && (
          <SuggestionChips
            suggestions={[
              ...contextualSuggestions.slice(0, 2),
              ...DEFAULT_SUGGESTIONS.slice(0, 3),
            ].slice(0, 4)}
            onSelect={handleSuggestionSelect}
            compact
          />
        )}

        {/* ── Terminal-style Input ──────────────────── */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <Text style={styles.promptChar}>{'›'}</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your property..."
              placeholderTextColor={c.textTertiary}
              multiline
              maxLength={500}
              returnKeyType="default"
              editable={!isGenerating}
            />
            <Pressable
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isGenerating}
              style={({ pressed }) => [
                styles.sendBtn,
                (!inputText.trim() || isGenerating) &&
                  styles.sendBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={c.accentPrimary} />
              ) : (
                <Icon
                  name="arrow-up"
                  size={18}
                  color={
                    inputText.trim() ? c.accentPrimary : c.textTertiary
                  }
                />
              )}
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
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconImg: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: t.mono,
    fontSize: 15,
    fontWeight: '700',
    color: c.textPrimary,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    ...t.headerLabel,
    fontSize: 10,
  },
  clearBtn: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 4,
  },
  clearText: {
    ...t.dataValue,
    color: c.textTertiary,
  },

  // ── Messages ──────────────────────────────────────
  messageListContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },

  // ── Input ─────────────────────────────────────────
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
    flexShrink: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
  },
  promptChar: {
    ...t.promptChar,
    color: c.accentPrimary,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: c.textPrimary,
    maxHeight: 100,
    minHeight: 22,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: c.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },

  // ── Welcome ───────────────────────────────────────
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    paddingBottom: 16,
  },
  welcomeBranding: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  welcomeLogo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontFamily: t.mono,
    fontSize: 22,
    fontWeight: '700',
    color: c.textPrimary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Enable Prompt ─────────────────────────────────
  enableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  enableLogo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  enableTitle: {
    fontFamily: t.mono,
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  enableSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  featureList: {
    width: '100%',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: c.textPrimary,
    marginLeft: 12,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: c.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...t.dataValue,
    color: c.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.accentPrimary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    minWidth: 220,
    gap: 8,
  },
  enableButtonText: {
    fontFamily: t.mono,
    fontSize: 14,
    fontWeight: '700',
    color: c.background,
    letterSpacing: 0.5,
  },
  notAvailableIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: c.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default AIAssistantScreen;
