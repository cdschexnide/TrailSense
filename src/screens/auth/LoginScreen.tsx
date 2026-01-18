/**
 * LoginScreen - REDESIGNED
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Pressable,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '@store/slices/authSlice';
import { AppDispatch, RootState } from '@store/index';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme, colorScheme } = useTheme();
  const colors = theme.colors;
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const handleLogin = async () => {
    if (!email.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }
    if (!password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Password Required', 'Please enter your password');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await dispatch(login({ email: email.trim(), password })).unwrap();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Reset Password', 'Password reset functionality coming soon.');
  };

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Register');
  };

  const brandOlive = '#4A5240';
  const brandTan = '#B8A67C';

  const inputBg = isDark ? 'rgba(44, 44, 46, 0.8)' : 'rgba(242, 242, 247, 0.9)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0A0A0A', '#1A1A1A', '#0D1210', '#0A0A0A']
          : ['#F5F5F7', '#FFFFFF', '#F0F2F0', '#F5F5F7']
        }
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.orbContainer}>
        <LinearGradient
          colors={[`${brandOlive}30`, `${brandOlive}00`]}
          style={[styles.orb, styles.orbTopRight]}
        />
        <LinearGradient
          colors={[`${brandTan}20`, `${brandTan}00`]}
          style={[styles.orb, styles.orbBottomLeft]}
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
            {/* Logo with glow effect */}
            <View style={styles.logoSection}>
              <View style={[styles.logoOuterRing, { borderColor: `${brandOlive}40` }]}>
                <LinearGradient
                  colors={[`${brandOlive}20`, `${brandTan}15`, `${brandOlive}20`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoInnerGlow}
                >
                  <Image
                    source={require('@assets/images/TrailSenseCompanyLogo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
            </View>

            {/* Title */}
            <View style={styles.headerSection}>
              <Text variant="largeTitle" weight="bold" color="label" numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
                Welcome Back
              </Text>
              <Text variant="body" color="secondaryLabel" style={styles.subtitle}>
                Sign in to access your security dashboard
              </Text>
            </View>

            {/* Form */}
            <View style={[styles.formCard, { backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)', borderColor: inputBorder }]}>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text variant="subheadline" weight="medium" color="secondaryLabel" style={styles.inputLabel}>
                  Email Address
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <Icon name="mail-outline" size={20} color={colors.secondaryLabel} />
                  <TextInput
                    style={[styles.input, { color: colors.label }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.tertiaryLabel}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text variant="subheadline" weight="medium" color="secondaryLabel">
                    Password
                  </Text>
                  <Pressable onPress={handleForgotPassword} hitSlop={8}>
                    <Text variant="subheadline" style={{ color: colors.systemBlue }}>
                      Forgot?
                    </Text>
                  </Pressable>
                </View>
                <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <Icon name="lock-closed-outline" size={20} color={colors.secondaryLabel} />
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { color: colors.label }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.tertiaryLabel}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                  <Pressable
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    hitSlop={8}
                  >
                    <Icon
                      name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.secondaryLabel}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Sign In Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.signInButtonWrapper,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <LinearGradient
                  colors={isLoading ? [colors.systemGray3, colors.systemGray4] : [brandOlive, '#3D4536']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signInButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text variant="headline" weight="semibold" style={{ color: '#FFFFFF' }}>
                        Sign In
                      </Text>
                      <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpSection}>
              <Text variant="body" color="secondaryLabel">
                Don't have an account?
              </Text>
              <Pressable onPress={handleSignUp}>
                <Text variant="body" weight="semibold" style={{ color: colors.systemBlue, marginLeft: 6 }}>
                  Sign Up
                </Text>
              </Pressable>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  orbTopRight: {
    top: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
  },
  orbBottomLeft: {
    bottom: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.3,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoOuterRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A5240',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  logoInnerGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    height: '100%',
  },
  signInButtonWrapper: {
    marginTop: 8,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  signUpSection: {
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
