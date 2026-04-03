/**
 * RegisterScreen - REDESIGNED
 *
 * Modern registration screen with:
 * - Consistent design language with LoginScreen
 * - Gradient background with brand colors
 * - Modern input fields with icons
 * - Visual password strength indicator
 * - Improved terms checkbox
 * - Clean visual hierarchy
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '@store/slices/authSlice';
import { AppDispatch, RootState } from '@store/index';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
}) => {
  const { theme, colorScheme } = useTheme();
  const colors = theme.colors;
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  // Brand colors derived from logo
  const brandOlive = '#4A5240';
  const brandTan = '#B8A67C';

  const getPasswordStrength = (
    pwd: string
  ): { level: string; score: number } => {
    if (!pwd) return { level: 'none', score: 0 };
    if (pwd.length < 6) return { level: 'weak', score: 1 };
    if (pwd.length < 8) return { level: 'fair', score: 2 };

    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    const strengthCount = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (strengthCount >= 3 && pwd.length >= 10)
      return { level: 'strong', score: 4 };
    if (strengthCount >= 2 && pwd.length >= 8)
      return { level: 'good', score: 3 };
    return { level: 'fair', score: 2 };
  };

  const getStrengthColor = (level: string): string => {
    switch (level) {
      case 'weak':
        return colors.systemRed;
      case 'fair':
        return colors.systemOrange;
      case 'good':
        return colors.systemYellow;
      case 'strong':
        return colors.systemGreen;
      default:
        return colors.systemGray4;
    }
  };

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (value.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    const { level } = getPasswordStrength(value);
    if (level === 'weak') {
      setPasswordError('Password is too weak');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value: string): boolean => {
    if (!value) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (value !== password) {
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!acceptedTerms) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Terms & Conditions',
        'Please accept the Terms & Conditions to continue'
      );
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await dispatch(
        register({ name: name.trim(), email: email.trim(), password })
      ).unwrap();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Welcome!', 'Your account has been created successfully!', [
        { text: 'OK' },
      ]);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to create account. Please try again.'
      );
    }
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  };

  const { level: strengthLevel, score: strengthScore } =
    getPasswordStrength(password);

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    iconName: string,
    focused: boolean,
    setFocused: (val: boolean) => void,
    error: string,
    options: {
      ref?: React.RefObject<TextInput>;
      secureTextEntry?: boolean;
      isVisible?: boolean;
      setIsVisible?: (val: boolean) => void;
      keyboardType?: 'default' | 'email-address';
      textContentType?: 'name' | 'emailAddress' | 'newPassword';
      returnKeyType?: 'next' | 'done' | 'go';
      onSubmitEditing?: () => void;
      onBlur?: () => void;
    } = {}
  ) => (
    <View style={styles.inputGroup}>
      <Text
        variant="subheadline"
        weight="medium"
        color={error ? 'systemRed' : 'secondaryLabel'}
        style={styles.inputLabel}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark
              ? 'rgba(44, 44, 46, 0.6)'
              : 'rgba(242, 242, 247, 0.8)',
            borderColor: error
              ? colors.systemRed
              : focused
                ? colors.systemBlue
                : isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)',
          },
          focused && !error && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <Icon
          name={iconName as any}
          size={20}
          color={
            error
              ? colors.systemRed
              : focused
                ? colors.systemBlue
                : colors.secondaryLabel
          }
        />
        <TextInput
          ref={options.ref}
          style={[styles.input, { color: colors.label }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.tertiaryLabel}
          secureTextEntry={options.secureTextEntry && !options.isVisible}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={
            options.keyboardType === 'email-address' ? 'none' : 'words'
          }
          autoCorrect={false}
          editable={!isLoading}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            options.onBlur?.();
          }}
          returnKeyType={options.returnKeyType || 'next'}
          onSubmitEditing={options.onSubmitEditing}
        />
        {options.secureTextEntry && options.setIsVisible && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              options.setIsVisible!(!options.isVisible);
            }}
            hitSlop={8}
          >
            <Icon
              name={options.isVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.secondaryLabel}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={14} color={colors.systemRed} />
          <Text variant="caption1" color="systemRed" style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#0A0A0A', '#1A1A1A', '#0D1210', '#0A0A0A']
            : ['#F5F5F7', '#FFFFFF', '#F0F2F0', '#F5F5F7']
        }
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={[`${brandTan}25`, `${brandTan}00`]}
          style={[styles.orb, styles.orbTopLeft]}
        />
        <LinearGradient
          colors={[`${brandOlive}20`, `${brandOlive}00`]}
          style={[styles.orb, styles.orbBottomRight]}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header with back button */}
            <View style={styles.header}>
              <Pressable
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.backButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.05)',
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Icon name="arrow-back" size={20} color={colors.label} />
              </Pressable>
            </View>

            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoGlow}>
                <Image
                  source={require('@assets/images/SmallTrailSenseCompanyLogo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text
                variant="largeTitle"
                weight="bold"
                color="label"
                style={styles.title}
              >
                Create Account
              </Text>
              <Text
                variant="body"
                color="secondaryLabel"
                style={styles.subtitle}
              >
                Join TrailSense to secure your property
              </Text>
            </View>

            {/* Form Card */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(28, 28, 30, 0.8)'
                    : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              {/* Name Input */}
              {renderInput(
                'Full Name',
                name,
                text => {
                  setName(text);
                  if (nameError) validateName(text);
                },
                'Enter your full name',
                'person-outline',
                nameFocused,
                setNameFocused,
                nameError,
                {
                  textContentType: 'name',
                  onSubmitEditing: () => emailRef.current?.focus(),
                  onBlur: () => validateName(name),
                }
              )}

              {/* Email Input */}
              {renderInput(
                'Email Address',
                email,
                text => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                },
                'Enter your email',
                'mail-outline',
                emailFocused,
                setEmailFocused,
                emailError,
                {
                  ref: emailRef,
                  keyboardType: 'email-address',
                  textContentType: 'emailAddress',
                  onSubmitEditing: () => passwordRef.current?.focus(),
                  onBlur: () => validateEmail(email),
                }
              )}

              {/* Password Input */}
              {renderInput(
                'Password',
                password,
                text => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                  if (confirmPassword) validateConfirmPassword(confirmPassword);
                },
                'Create a strong password',
                'lock-closed-outline',
                passwordFocused,
                setPasswordFocused,
                passwordError,
                {
                  ref: passwordRef,
                  secureTextEntry: true,
                  isVisible: isPasswordVisible,
                  setIsVisible: setIsPasswordVisible,
                  textContentType: 'newPassword',
                  onSubmitEditing: () => confirmPasswordRef.current?.focus(),
                  onBlur: () => validatePassword(password),
                }
              )}

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map(bar => (
                      <View
                        key={bar}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              bar <= strengthScore
                                ? getStrengthColor(strengthLevel)
                                : isDark
                                  ? 'rgba(255,255,255,0.1)'
                                  : 'rgba(0,0,0,0.1)',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text variant="caption1" style={styles.strengthText}>
                    <Text style={{ color: getStrengthColor(strengthLevel) }}>
                      {strengthLevel.charAt(0).toUpperCase() +
                        strengthLevel.slice(1)}
                    </Text>
                  </Text>
                </View>
              )}

              {/* Confirm Password Input */}
              {renderInput(
                'Confirm Password',
                confirmPassword,
                text => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) validateConfirmPassword(text);
                },
                'Re-enter your password',
                'shield-checkmark-outline',
                confirmPasswordFocused,
                setConfirmPasswordFocused,
                confirmPasswordError,
                {
                  ref: confirmPasswordRef,
                  secureTextEntry: true,
                  isVisible: isConfirmPasswordVisible,
                  setIsVisible: setIsConfirmPasswordVisible,
                  textContentType: 'newPassword',
                  returnKeyType: 'done',
                  onSubmitEditing: handleRegister,
                  onBlur: () => validateConfirmPassword(confirmPassword),
                }
              )}

              {/* Terms Checkbox */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAcceptedTerms(!acceptedTerms);
                }}
                style={styles.termsContainer}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: acceptedTerms
                        ? brandOlive
                        : 'transparent',
                      borderColor: acceptedTerms
                        ? brandOlive
                        : colors.systemGray3,
                    },
                  ]}
                >
                  {acceptedTerms && (
                    <Icon name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  variant="subheadline"
                  color="secondaryLabel"
                  style={styles.termsText}
                >
                  I agree to the{' '}
                  <Text
                    variant="subheadline"
                    style={{ color: colors.systemBlue }}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    variant="subheadline"
                    style={{ color: colors.systemBlue }}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </Pressable>

              {/* Create Account Button */}
              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.createButtonWrapper,
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                ]}
              >
                <LinearGradient
                  colors={
                    isLoading
                      ? [colors.systemGray3, colors.systemGray4]
                      : [brandOlive, '#3D4536']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text
                        variant="headline"
                        weight="semibold"
                        style={styles.createButtonText}
                      >
                        Create Account
                      </Text>
                      <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Sign In Link */}
            <View style={styles.signInSection}>
              <Text variant="body" style={{ color: colors.secondaryLabel }}>
                Already have an account?
              </Text>
              <Pressable
                onPress={handleLogin}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <Text
                  variant="body"
                  weight="semibold"
                  style={{ color: colors.systemBlue, marginLeft: 6 }}
                >
                  Sign In
                </Text>
              </Pressable>
            </View>

            {/* Security Badge */}
            <View
              style={[
                styles.securityBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(52, 199, 89, 0.1)'
                    : 'rgba(52, 199, 89, 0.08)',
                },
              ]}
            >
              <Icon
                name="shield-checkmark"
                size={16}
                color={colors.systemGreen}
              />
              <Text
                variant="caption1"
                style={{ color: colors.systemGreen, marginLeft: 6 }}
              >
                Your data stays on your device
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
  },
  orbTopLeft: {
    top: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.2,
  },
  orbBottomRight: {
    bottom: -SCREEN_WIDTH * 0.15,
    right: -SCREEN_WIDTH * 0.2,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoGlow: {
    shadowColor: '#4A5240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputFocused: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    paddingVertical: 14,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    marginLeft: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    marginLeft: 12,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    lineHeight: 20,
  },
  createButtonWrapper: {
    shadowColor: '#4A5240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
  },
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
});
