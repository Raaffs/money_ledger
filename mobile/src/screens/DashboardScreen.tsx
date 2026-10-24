import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { loansApi } from '../api/loans';
import { Loan, LoanSummary } from '../types/index';
import { SummaryCards } from '../components/SummaryCards';
import { LoanTable } from '../components/LoanTable';
import { CreateLoanModal } from '../components/CreateLoanModal';

type FilterType = 'all' | 'lent' | 'borrowed' | 'pending' | 'overdue' | 'repaid';

interface DashboardScreenProps {
  onSelectLoan: (loan: Loan) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onSelectLoan }) => {
  const { user, logout } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary>({
    total_lent: 0,
    total_repaid: 0,
    overdue_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [summaryData, loansData] = await Promise.all([
        loansApi.getSummary(),
        loansApi.getLoans(),
      ]);
      setSummary(summaryData);
      setLoans(loansData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLoanCreated = (newLoan: Loan) => {
    setIsCreateModalOpen(false);
    loadData();
  };

  // Client-side filtering
  const filteredLoans = loans.filter((loan) => {
    const isLender = loan.lender_id === user?.id;

    if (filter === 'lent') return isLender;
    if (filter === 'borrowed') return !isLender;
    if (filter === 'pending') return loan.status === 'PENDING';
    if (filter === 'overdue') return loan.is_overdue && loan.status !== 'REPAID';
    if (filter === 'repaid') return loan.status === 'REPAID';
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Top App Header */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="wallet" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.brandText}>MiniLedger</Text>
              <Text style={styles.userGreeting}>
                Hi, {user?.display_name || user?.username}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Financial Summary Cards */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <SummaryCards summary={summary} />
        )}

        {/* Action Header: Primary Add Button & Title */}
        <View style={styles.actionHeader}>
          <View>
            <Text style={styles.sectionHeading}>Loan Ledger</Text>
            <Text style={styles.sectionSubheading}>
              {loans.length} total active & settled transactions
            </Text>
          </View>

          <TouchableOpacity
            style={styles.lendButton}
            onPress={() => setIsCreateModalOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.lendButtonText}>Lend Money</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {[
            { id: 'all', label: 'All' },
            { id: 'lent', label: 'Money Lent' },
            { id: 'borrowed', label: 'Borrowed' },
            { id: 'pending', label: 'Pending' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'repaid', label: 'Settled' },
          ].map((item) => {
            const active = filter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(item.id as FilterType)}
              >
                <Text
                  style={[styles.filterChipText, active && styles.filterChipTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loans Table */}
        <LoanTable
          loans={filteredLoans}
          currentUserId={user?.id || ''}
          onSelectLoan={onSelectLoan}
          onAddNew={() => setIsCreateModalOpen(true)}
        />
      </ScrollView>

      {/* Modal to Create a Loan */}
      <CreateLoanModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleLoanCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  userGreeting: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  loaderBox: {
    padding: 24,
    alignItems: 'center',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubheading: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  lendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  lendButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
});
