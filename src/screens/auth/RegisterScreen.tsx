import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Input, Text, Badge } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { register } from '@store/slices/authSlice';
import { AppDispatch, RootState } from '@store/index';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const getPasswordStrength = (password: string): string => {
    if (!password) return 'none';
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strengthCount = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (strengthCount >= 3 && password.length >= 10) return 'strong';
    if (strengthCount >= 2) return 'medium';
    return 'weak';
  };

  const getPasswordStrengthColor = (strength: string): string => {
    switch (strength) {
      case 'weak':
        return '#FF6B6B';
      case 'medium':
        return '#FFB800';
      case 'strong':
        return '#51CF66';
      default:
        return '#868E96';
    }
  };

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
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
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    const strength = getPasswordStrength(password);
    if (strength === 'weak') {
      setPasswordError(
        'Password is too weak. Use uppercase, lowercase, numbers, and special characters'
      );
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPwd: string): boolean => {
    if (!confirmPwd) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPwd !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleRegister = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (
      !isNameValid ||
      !isEmailValid ||
      !isPasswordValid ||
      !isConfirmPasswordValid
    ) {
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(
        'Terms & Conditions',
        'Please accept the Terms & Conditions to continue'
      );
      return;
    }

    try {
      await dispatch(
        register({
          name: name.trim(),
          email: email.trim(),
          password,
        })
      ).unwrap();

      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to create account. Please try again.'
      );
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const passwordStrength = getPasswordStrength(password);

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
              Create Account
            </Text>
            <Text variant="body" style={styles.subtitle}>
              Sign up to get started with TrailSense
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={text => {
                setName(text);
                if (nameError) validateName(text);
              }}
              onBlur={() => validateName(name)}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoComplete="name"
              error={nameError}
              disabled={isLoading}
            />

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

            <View>
              <Input
                label="Password"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                  if (confirmPassword) validateConfirmPassword(confirmPassword);
                }}
                onBlur={() => validatePassword(password)}
                placeholder="Create a strong password"
                secureTextEntry
                autoComplete="password-new"
                error={passwordError}
                disabled={isLoading}
              />
              {password.length > 0 && (
                <View style={styles.passwordStrength}>
                  <Text variant="caption" style={styles.strengthLabel}>
                    Password Strength:
                  </Text>
                  <Badge
                    label={passwordStrength.toUpperCase()}
                    variant="info"
                    style={{
                      backgroundColor:
                        getPasswordStrengthColor(passwordStrength),
                    }}
                  />
                </View>
              )}
            </View>

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (confirmPasswordError) validateConfirmPassword(text);
              }}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              placeholder="Re-enter your password"
              secureTextEntry
              autoComplete="password-new"
              error={confirmPasswordError}
              disabled={isLoading}
            />

            <View style={styles.termsContainer}>
              <Button
                title={acceptedTerms ? '☑' : '☐'}
                variant="ghost"
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                style={styles.checkbox}
              />
              <Text variant="body" style={styles.termsText}>
                I accept the{' '}
                <Text variant="body" style={styles.link}>
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text variant="body" style={styles.link}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <Button
              title="Create Account"
              variant="primary"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <Text variant="body">Already have an account? </Text>
              <Button
                title="Sign In"
                variant="ghost"
                onPress={handleLogin}
                disabled={isLoading}
              />
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
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  strengthLabel: {
    marginRight: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  checkbox: {
    marginRight: 8,
    padding: 0,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
