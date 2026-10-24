import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PhoneLoginScreen } from './src/screens/PhoneLoginScreen';
import { OtpVerifyScreen } from './src/screens/OtpVerifyScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LoanDetailScreen } from './src/screens/LoanDetailScreen';
import { colors } from './src/theme/colors';

type AuthStep = 'phone' | 'otp';

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [step, setStep] = useState<AuthStep>('phone');
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setStep('phone');
      setPendingPhone('');
      setSelectedLoanId(null);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Authenticated flow
  if (isAuthenticated && user) {
    if (selectedLoanId) {
      return (
        <LoanDetailScreen
          loanId={selectedLoanId}
          currentUserId={user.id}
          onBack={() => setSelectedLoanId(null)}
          onLoanUpdated={() => setSelectedLoanId(null)}
        />
      );
    }

    return (
      <DashboardScreen
        onSelectLoan={(loan) => setSelectedLoanId(loan.id)}
      />
    );
  }

  // Unauthenticated login & OTP flow
  if (step === 'otp') {
    return (
      <OtpVerifyScreen
        phone={pendingPhone}
        isExistingUser={isExistingUser}
        onBack={() => setStep('phone')}
      />
    );
  }

  return (
    <PhoneLoginScreen
      onOtpSent={(phone, existing) => {
        setPendingPhone(phone);
        setIsExistingUser(existing);
        setStep('otp');
      }}
    />
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
