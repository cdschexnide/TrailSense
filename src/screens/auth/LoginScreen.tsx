import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Input, Text } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { login, setBiometricEnabled } from '@store/slices/authSlice';
import { AppDispatch, RootState } from '@store/index';
import { AuthService } from '@services/authService';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, biometricEnabled } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    checkBiometricAuth();
  }, []);

  const checkBiometricAuth = async () => {
    const isEnabled = await AuthService.isBiometricEnabled();
    const isSupported = await AuthService.checkBiometricSupport();

    if (isEnabled && isSupported) {
      const success = await AuthService.authenticateWithBiometric();
      if (success) {
        // Auto-login with stored credentials
        const tokens = await AuthService.getTokens();
        if (tokens) {
          // User authenticated via biometric
          dispatch(setBiometricEnabled(true));
        }
      }
    }
  };

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

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      // Trigger error haptic for validation failure
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await dispatch(login({ email, password })).unwrap();

      // Trigger success haptic for successful login
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Check if biometric is available and prompt user to enable
      const isSupported = await AuthService.checkBiometricSupport();
      if (isSupported && !biometricEnabled) {
        Alert.alert(
          'Enable Biometric Authentication?',
          'Would you like to use Face ID/Touch ID for faster login?',
          [
            {
              text: 'Not Now',
              style: 'cancel',
            },
            {
              text: 'Enable',
              onPress: async () => {
                await AuthService.enableBiometric();
                dispatch(setBiometricEnabled(true));
              },
            },
          ]
        );
      }
    } catch (error: any) {
      // Trigger error haptic for login failure
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password. Please try again.'
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
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
            <Text variant="largeTitle" weight="bold" style={styles.title}>
              Welcome Back
            </Text>
            <Text variant="body" color="secondaryLabel" style={styles.subtitle}>
              Sign in to continue to TrailSense
            </Text>
          </View>

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
              textContentType="emailAddress"
              returnKeyType="next"
              error={emailError}
              disabled={isLoading}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (passwordError) validatePassword(text);
              }}
              onBlur={() => validatePassword(password)}
              placeholder="Enter your password"
              secureTextEntry
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              error={passwordError}
              disabled={isLoading}
            />

            <Button
              buttonStyle="plain"
              onPress={handleForgotPassword}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>

            <Button
              buttonStyle="filled"
              role="default"
              prominent
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            >
              Sign In
            </Button>

            <View style={styles.registerContainer}>
              <Text variant="body">Don't have an account? </Text>
              <Button
                buttonStyle="plain"
                onPress={handleRegister}
                disabled={isLoading}
              >
                Sign Up
              </Button>
            </View>
          </View>
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
    // No opacity needed - using secondaryLabel color
  },
  form: {
    width: '100%',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
