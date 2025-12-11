/**
 * ChatMessage - REDESIGNED V2
 *
 * Enhanced chat interface with:
 * - Glass-morphism AI bubbles with gradient border
 * - Animated typing indicator
 * - Premium action buttons
 * - Better visual hierarchy
 * - Entrance animations
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ChatMessage as ChatMessageType } from '@/types/llm';
import { useTheme } from '@hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onCopy?: (text: string) => void;
  onFeedback?: (positive: boolean) => void;
  showFeedback?: boolean;
}

// Animated typing dots component
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 150);
    const anim3 = animateDot(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingDots}>
        <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
        <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
        <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
      </View>
      <Text variant="caption1" style={styles.typingText}>
        AI is thinking...
      </Text>
    </View>
  );
};

export const ChatMessage = memo<ChatMessageProps>(
  ({
    message,
    isStreaming = false,
    onCopy,
    onFeedback,
    showFeedback = false,
  }) => {
    const { theme, colorScheme } = useTheme();
    const colors = theme.colors;
    const isDark = colorScheme === 'dark';
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    // Entrance animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    if (isSystem) return null;

    const handleCopy = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Clipboard.setString(message.content);
      onCopy?.(message.content);
    };

    const handleFeedbackPress = (positive: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onFeedback?.(positive);
    };

    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
    };

    // Enhanced markdown parsing
    const renderContent = (text: string) => {
      if (!text) return null;

      // Split by bold markers and code blocks
      const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} weight="bold" style={{ color: colors.label }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <Text
              key={index}
              style={{
                ...styles.codeText,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                color: colors.systemPurple,
              }}
            >
              {part.slice(1, -1)}
            </Text>
          );
        }
        return (
          <Text key={index} style={{ color: colors.label }}>
            {part}
          </Text>
        );
      });
    };

    return (
      <Animated.View
        style={[
          styles.container,
          isUser ? styles.userContainer : styles.assistantContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* AI Avatar with company logo */}
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: isDark ? 'rgba(74, 82, 64, 0.3)' : 'rgba(74, 82, 64, 0.15)' }]}>
              <Image
                source={require('@assets/images/SmallTrailSenseCompanyLogo.png')}
                style={styles.aiAvatarImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        <View style={[styles.bubbleWrapper, isUser ? styles.userBubbleWrapper : styles.assistantBubbleWrapper]}>
          {/* Message Bubble */}
          {isUser ? (
            <View style={styles.userBubbleOuter}>
              <LinearGradient
                colors={['#4A5240', '#3D4536']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, styles.userBubble]}
              >
                <Text variant="body" style={styles.userText}>
                  {message.content}
                </Text>
              </LinearGradient>
              {/* Timestamp for user */}
              <Text variant="caption2" style={{ ...styles.userTimestamp, color: colors.tertiaryLabel }}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          ) : (
            <View style={styles.aiBubbleContainer}>
              {/* Gradient border for AI bubble */}
              <LinearGradient
                colors={isDark ? ['rgba(74,82,64,0.4)', 'rgba(184,166,124,0.3)'] : ['rgba(74,82,64,0.2)', 'rgba(184,166,124,0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiBubbleBorder}
              >
                <View
                  style={[
                    styles.bubble,
                    styles.assistantBubble,
                    {
                      backgroundColor: isDark
                        ? 'rgba(44, 44, 46, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                    }
                  ]}
                >
                  {message.content ? (
                    <Text variant="body" style={styles.aiMessageText}>
                      {renderContent(message.content)}
                    </Text>
                  ) : isStreaming ? (
                    <TypingIndicator />
                  ) : null}
                </View>
              </LinearGradient>

              {/* AI Message Actions */}
              {message.content && (
                <View style={styles.aiActionsRow}>
                  <Text variant="caption2" style={{ color: colors.tertiaryLabel }}>
                    {formatTime(message.timestamp)}
                  </Text>

                  <View style={styles.aiActionsGroup}>
                    {/* Copy Button */}
                    <TouchableOpacity
                      onPress={handleCopy}
                      style={[
                        styles.actionPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.04)',
                        }
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="copy-outline" size={14} color={colors.secondaryLabel} />
                      <Text variant="caption2" style={{ color: colors.secondaryLabel, marginLeft: 4 }}>
                        Copy
                      </Text>
                    </TouchableOpacity>

                    {/* Feedback Buttons */}
                    {showFeedback && (
                      <View style={styles.feedbackPills}>
                        <TouchableOpacity
                          onPress={() => handleFeedbackPress(true)}
                          style={[
                            styles.feedbackPill,
                            { backgroundColor: 'rgba(52, 199, 89, 0.12)' }
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        >
                          <Icon name="thumbs-up" size={14} color={colors.systemGreen} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleFeedbackPress(false)}
                          style={[
                            styles.feedbackPill,
                            { backgroundColor: 'rgba(255, 59, 48, 0.12)' }
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        >
                          <Icon name="thumbs-down" size={14} color={colors.systemRed} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginTop: 4,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A5240',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  aiAvatarImage: {
    width: 28,
    height: 28,
  },
  bubbleWrapper: {
    maxWidth: '82%',
    marginHorizontal: 10,
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
  },
  assistantBubbleWrapper: {
    alignItems: 'flex-start',
  },
  userBubbleOuter: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  userBubble: {
    borderBottomRightRadius: 6,
    shadowColor: '#4A5240',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  assistantBubble: {
    borderBottomLeftRadius: 6,
    margin: 1.5,
  },
  userText: {
    color: '#FFFFFF',
    lineHeight: 22,
  },
  userTimestamp: {
    marginTop: 6,
    marginRight: 4,
  },
  aiBubbleContainer: {
    flex: 1,
  },
  aiBubbleBorder: {
    borderRadius: 22,
    padding: 1.5,
    shadowColor: '#4A5240',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  aiMessageText: {
    lineHeight: 24,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A5240',
  },
  typingText: {
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  aiActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  aiActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  feedbackPills: {
    flexDirection: 'row',
    gap: 6,
  },
  feedbackPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;
