import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface OtpVerifyScreenProps {
  phone: string;
  isExistingUser: boolean;
  onBack: () => void;
}

export const OtpVerifyScreen: React.FC<OtpVerifyScreenProps> = ({
  phone,
  isExistingUser,
  onBack,
}) => {
  const { verifyOtp, requestOtp } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [isResending, setIsResending] = useState(false);

  // Optional profile fields for first-time registration
  const [showProfileFields, setShowProfileFields] = useState(!isExistingUser);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');

  // Refs for 6 inputs
  const inputRefs = useRef<any[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleOtpChange = (value: string, index: number) => {
    if (error) setError(null);

    // Handle full paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (digits.length === 6) {
        submitVerification(digits.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto advance to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit on last digit
    if (index === 5 && value) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        submitVerification(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitVerification = async (codeToVerify?: string) => {
    const finalOtp = codeToVerify || otp.join('');
    if (finalOtp.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await verifyOtp(
        phone,
        finalOtp,
        username.trim() || undefined,
        displayName.trim() || undefined
      );
      // Navigation is automatically handled by AuthContext state change!
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setError(null);
    setIsResending(true);
    try {
      await requestOtp(phone);
      setResendCooldown(45);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Link */}
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backButtonText}>Change number</Text>
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.badgeHeader}>
            <View style={styles.iconBadge}>
              <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.cardTitle}>Enter 6-Digit Code</Text>
          <Text style={styles.cardSubtitle}>
            We've sent a verification code to{' '}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 6 Digit Input Boxes */}
          <View style={styles.otpBoxesRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => {
                  inputRefs.current[idx] = ref;
                }}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  error ? styles.otpBoxError : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => handleOtpChange(val, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                autoFocus={idx === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Optional Profile Customization for New Users */}
          {!isExistingUser && (
            <View style={styles.profileSection}>
              <TouchableOpacity
                style={styles.profileToggle}
                onPress={() => setShowProfileFields(!showProfileFields)}
              >
                <Text style={styles.profileToggleText}>
                  {showProfileFields ? '▼ Customize Profile' : '▶ Customize Name & Username (Optional)'}
                </Text>
              </TouchableOpacity>

              {showProfileFields && (
                <View style={styles.profileInputs}>
                  <TextInput
                    style={styles.profileInput}
                    placeholder="Full / Display Name (e.g. Alice Cooper)"
                    placeholderTextColor={colors.textMuted}
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                  <TextInput
                    style={styles.profileInput}
                    placeholder="Unique Username (e.g. alice_cooper)"
                    placeholderTextColor={colors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              )}
            </View>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={() => submitVerification()}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP Row */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive code?</Text>
            {resendCooldown > 0 ? (
              <Text style={styles.timerText}>Resend in {resendCooldown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={isResending}>
                <Text style={styles.resendAction}>
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Development Helper */}
        <View style={styles.devHint}>
          <Ionicons name="terminal-outline" size={14} color={colors.primary} />
          <Text style={[styles.devHintText, { color: colors.textSecondary }]}>
            Mock OTP Code: <Text style={{ fontWeight: '700', color: colors.text }}>123456</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    gap: 6,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  phoneHighlight: {
    color: colors.text,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
    width: '100%',
  },
  otpBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 50,
    height: 56,
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  otpBoxError: {
    borderColor: colors.danger,
  },
  profileSection: {
    marginBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  profileToggle: {
    paddingVertical: 6,
  },
  profileToggleText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  profileInputs: {
    marginTop: 10,
    gap: 10,
  },
  profileInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  resendLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  timerText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  resendAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  devHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  devHintText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
