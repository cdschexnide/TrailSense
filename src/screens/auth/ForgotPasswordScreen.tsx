import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Input, Text } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import axiosInstance from '@api/axiosInstance';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    const isEmailValid = validateEmail(email);

    if (!isEmailValid) {
      return;
    }

    setIsLoading(true);

    try {
      await axiosInstance.post('/auth/forgot-password', {
        email: email.trim(),
      });

      setEmailSent(true);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Unable to send password reset email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text variant="h1" style={styles.title}>
              Forgot Password
            </Text>
            <Text variant="body" style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset
              your password
            </Text>
          </View>

          {!emailSent ? (
            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                onBlur={() => validateEmail(email)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={emailError}
                disabled={isLoading}
              />

              <Button
                title="Send Reset Link"
                variant="primary"
                onPress={handleResetPassword}
                loading={isLoading}
                disabled={isLoading}
                style={styles.resetButton}
              />

              <Button
                title="Back to Sign In"
                variant="ghost"
                onPress={handleBackToLogin}
                disabled={isLoading}
                style={styles.backButton}
              />
            </View>
          ) : (
            <View style={styles.successContainer}>
              <Text variant="h2" style={styles.successTitle}>
                Check Your Email
              </Text>
              <Text variant="body" style={styles.successText}>
                We've sent password reset instructions to {email}
              </Text>
              <Button
                title="Back to Sign In"
                variant="primary"
                onPress={handleBackToLogin}
                style={styles.backButton}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
  },
  resetButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    marginBottom: 16,
  },
  successText: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
});
