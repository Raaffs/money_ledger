import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const WelcomeScreen: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [summary, setSummary] = useState<{
    total_lent: number;
    total_repaid: number;
    overdue_amount: number;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await apiClient<{
          success: boolean;
          data: { total_lent: number; total_repaid: number; overdue_amount: number };
        }>('/loans/summary');
        if (res.data) {
          setSummary(res.data);
        }
      } catch (e) {
        console.error('Failed to load summary:', e);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <View style={styles.navBrand}>
          <Ionicons name="wallet" size={24} color={colors.primary} />
          <Text style={styles.navTitle}>MiniLedger</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutIconButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* User Hero Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? getInitials(user.display_name || user.username) : 'U'}
          </Text>
        </View>

        <View style={styles.profileDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{user?.display_name}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.phoneText}>{user?.phone}</Text>
        </View>
      </View>

      {/* Quick Financial Overview */}
      <Text style={styles.sectionTitle}>Overview</Text>

      {loadingSummary ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statLent]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="arrow-up-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>Total Lent</Text>
            <Text style={styles.statValue}>
              ₹{summary?.total_lent?.toLocaleString('en-IN') ?? '0'}
            </Text>
          </View>

          <View style={[styles.statCard, styles.statRepaid]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.success} />
            </View>
            <Text style={styles.statLabel}>Total Repaid</Text>
            <Text style={styles.statValue}>
              ₹{summary?.total_repaid?.toLocaleString('en-IN') ?? '0'}
            </Text>
          </View>

          <View style={[styles.statCard, styles.statOverdue]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            </View>
            <Text style={styles.statLabel}>Overdue</Text>
            <Text style={styles.statValue}>
              ₹{summary?.overdue_amount?.toLocaleString('en-IN') ?? '0'}
            </Text>
          </View>
        </View>
      )}

      {/* Next Step Banner */}
      <View style={styles.dashboardBanner}>
        <View style={styles.bannerIcon}>
          <Ionicons name="sparkles" size={24} color={colors.primary} />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Authentication Successful!</Text>
          <Text style={styles.bannerSubtitle}>
            Your JWT session is active and verified against PostgreSQL. We are ready to
            plug in the loan creation and repayment workflows next.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  logoutIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 28,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  phoneText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  loaderBox: {
    padding: 24,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statLent: {},
  statRepaid: {},
  statOverdue: {},
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  dashboardBanner: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'flex-start',
    gap: 14,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
