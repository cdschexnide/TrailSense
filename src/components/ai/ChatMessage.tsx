/**
 * ChatMessage — Tactical Redesign
 *
 * User messages: tactical green-tinted bubbles
 * AI messages: delegates to CardRouter for rich briefing cards
 * Fallback: TextCard for legacy messages without structuredData
 */

import React, { memo, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text } from '@components/atoms/Text';
import { ChatMessage as ChatMessageType } from '@/types/llm';
import {
  tacticalColors as c,
  tacticalTypography as t,
} from '@/constants/tacticalTheme';
import { CardRouter } from './cards/CardRouter';
import { TextCard } from './cards/TextCard';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onCopy?: (text: string) => void;
  onFeedback?: (positive: boolean) => void;
  showFeedback?: boolean;
}

// Animated typing dots
const TypingIndicator = () => {
  const [dot1] = useState(() => new Animated.Value(0));
  const [dot2] = useState(() => new Animated.Value(0));
  const [dot3] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
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

    const anims = [animateDot(dot1, 0), animateDot(dot2, 150), animateDot(dot3, 300)];
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [dot1, dot2, dot3]);

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
      <Text style={styles.typingText}>AI is thinking...</Text>
    </View>
  );
};

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

const ChatMessageComponent = ({
  message,
  isStreaming = false,
  onCopy,
  onFeedback,
}: ChatMessageProps) => {
  const isUser = message.role === 'user';
  if (message.role === 'system') return null;

  // Entrance animation
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(isUser ? 20 : -20));

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
  }, [fadeAnim, slideAnim]);

  // ── User message ────────────────────────────────────
  if (isUser) {
    return (
      <Animated.View
        style={[
          styles.container,
          styles.userContainer,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      </Animated.View>
    );
  }

  // ── AI message: streaming placeholder ───────────────
  if (!message.content && isStreaming) {
    return (
      <Animated.View
        style={[
          styles.container,
          styles.aiContainer,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <TypingIndicator />
      </Animated.View>
    );
  }

  // ── AI message: rich card or text fallback ──────────
  const assessmentUnavailable = !message.content;

  return (
    <Animated.View
      style={[
        styles.container,
        styles.aiContainer,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {message.structuredData ? (
        <CardRouter
          structuredData={message.structuredData}
          assessment={message.content}
          assessmentUnavailable={assessmentUnavailable}
          onCopy={() => onCopy?.(message.content)}
          onFeedback={onFeedback}
        />
      ) : (
        <TextCard
          assessment={message.content}
          assessmentUnavailable={assessmentUnavailable}
          onCopy={() => onCopy?.(message.content)}
          onFeedback={onFeedback}
        />
      )}
      <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
    </Animated.View>
  );
};

export const ChatMessage = memo(ChatMessageComponent);

const styles = StyleSheet.create({
  container: {
    marginVertical: 7,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: c.userBubble,
    borderWidth: 1,
    borderColor: c.userBubbleBorder,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '78%',
  },
  userText: {
    color: c.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    ...t.timestamp,
    color: c.textTertiary,
    marginTop: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    backgroundColor: c.accentPrimary,
  },
  typingText: {
    color: c.textTertiary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;
