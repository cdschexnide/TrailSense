import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { ChatMessage as ChatMessageType } from '@/types/llm';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onCopy?: (text: string) => void;
  onFeedback?: (positive: boolean) => void;
  showFeedback?: boolean;
}

/**
 * Professional Chat Message Component
 * Renders user and assistant messages with appropriate styling
 */
export const ChatMessage = memo<ChatMessageProps>(
  ({
    message,
    isStreaming = false,
    onCopy,
    onFeedback,
    showFeedback = false,
  }) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    // Don't render system messages
    if (isSystem) return null;

    const handleCopy = () => {
      Clipboard.setString(message.content);
      onCopy?.(message.content);
    };

    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Parse markdown-style formatting
    const renderContent = (text: string) => {
      if (!text) return null;

      // Simple markdown parsing for bold
      const parts = text.split(/(\*\*[^*]+\*\*)/g);

      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={styles.boldText}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      });
    };

    return (
      <View
        style={[
          styles.container,
          isUser ? styles.userContainer : styles.assistantContainer,
        ]}
      >
        {/* Avatar */}
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>AI</Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.bubbleWrapper,
            isUser ? styles.userBubbleWrapper : styles.assistantBubbleWrapper,
          ]}
        >
          {/* Message Bubble */}
          <View
            style={[
              styles.bubble,
              isUser ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {message.content ? (
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userText : styles.assistantText,
                ]}
              >
                {renderContent(message.content)}
              </Text>
            ) : isStreaming ? (
              <View style={styles.streamingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.streamingText}>Thinking...</Text>
              </View>
            ) : null}
          </View>

          {/* Message Meta */}
          <View
            style={[
              styles.metaContainer,
              isUser ? styles.userMeta : styles.assistantMeta,
            ]}
          >
            <Text style={styles.timestamp}>
              {formatTime(message.timestamp)}
            </Text>

            {/* Copy button for assistant messages */}
            {!isUser && message.content && (
              <TouchableOpacity
                onPress={handleCopy}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.actionText}>Copy</Text>
              </TouchableOpacity>
            )}

            {/* Feedback buttons */}
            {!isUser && showFeedback && message.content && (
              <View style={styles.feedbackContainer}>
                <TouchableOpacity
                  onPress={() => onFeedback?.(true)}
                  style={styles.feedbackButton}
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                >
                  <Text style={styles.feedbackIcon}>👍</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onFeedback?.(false)}
                  style={styles.feedbackButton}
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                >
                  <Text style={styles.feedbackIcon}>👎</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* User Avatar */}
        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>You</Text>
            </View>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  bubbleWrapper: {
    maxWidth: '75%',
    marginHorizontal: 8,
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
  },
  assistantBubbleWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#FFFFFF',
  },
  boldText: {
    fontWeight: '700',
  },
  streamingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  streamingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  userMeta: {
    justifyContent: 'flex-end',
  },
  assistantMeta: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: 11,
    color: '#8E8E93',
  },
  actionButton: {
    marginLeft: 12,
  },
  actionText: {
    fontSize: 11,
    color: '#007AFF',
  },
  feedbackContainer: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  feedbackButton: {
    marginLeft: 4,
  },
  feedbackIcon: {
    fontSize: 14,
  },
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;
