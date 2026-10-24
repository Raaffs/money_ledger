import React, { useState } from 'react';
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

interface PhoneLoginScreenProps {
  onOtpSent: (phone: string, isExistingUser: boolean) => void;
}

export const PhoneLoginScreen: React.FC<PhoneLoginScreenProps> = ({ onOtpSent }) => {
  const { requestOtp } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setError(null);
    const cleanDigits = phoneNumber.replace(/\D/g, '');

    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // Default to +91 country code if not prefixed
    const fullPhone = phoneNumber.startsWith('+') ? phoneNumber.trim() : `+91${cleanDigits}`;

    try {
      setLoading(true);
      const { isExistingUser } = await requestOtp(fullPhone);
      onOtpSent(fullPhone, isExistingUser);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check backend connection.');
    } finally {
      setLoading(false);
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
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="wallet-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandSubtitle}>
            Track loans & shared expenses with friends with complete transparency
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in or Register</Text>
          <Text style={styles.cardSubtitle}>
            Enter your mobile number. We'll send you a 6-digit verification code.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Phone Input Container */}
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <View style={styles.countryCodeBadge}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="98765 43210"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (error) setError(null);
              }}
              maxLength={15}
              autoFocus
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Get Verification Code</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Server Mock Notice */}
          <View style={styles.mockNotice}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.mockNoticeText}>
              Mock OTP mode: Enter code <Text style={{ fontWeight: '700', color: colors.text }}>123456</Text> on the next screen.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure, passwordless authentication</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 12,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    overflow: 'hidden',
    marginBottom: 24,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: colors.inputBorder,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  flag: {
    fontSize: 16,
  },
  countryCodeText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  mockNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    gap: 8,
  },
  mockNoticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
