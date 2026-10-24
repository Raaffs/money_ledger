import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Loan } from '../types/index';

interface LoanTableProps {
  loans: Loan[];
  currentUserId: string;
  onSelectLoan: (loan: Loan) => void;
  onAddNew: () => void;
}

export const LoanTable: React.FC<LoanTableProps> = ({
  loans,
  currentUserId,
  onSelectLoan,
  onAddNew,
}) => {
  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (status === 'REPAID') {
      return (
        <View style={[styles.statusBadge, styles.statusRepaid]}>
          <Ionicons name="checkmark-circle" size={12} color={colors.success} />
          <Text style={[styles.statusText, { color: colors.success }]}>Repaid</Text>
        </View>
      );
    }

    if (isOverdue) {
      return (
        <View style={[styles.statusBadge, styles.statusOverdue]}>
          <Ionicons name="alert-circle" size={12} color={colors.danger} />
          <Text style={[styles.statusText, { color: colors.danger }]}>Overdue</Text>
        </View>
      );
    }

    if (status === 'PARTIALLY_PAID') {
      return (
        <View style={[styles.statusBadge, styles.statusPartial]}>
          <Ionicons name="pie-chart-outline" size={12} color="#06B6D4" />
          <Text style={[styles.statusText, { color: '#06B6D4' }]}>Partial</Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, styles.statusPending]}>
        <Ionicons name="time-outline" size={12} color={colors.warning} />
        <Text style={[styles.statusText, { color: colors.warning }]}>Pending</Text>
      </View>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="file-tray-outline" size={36} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No Loan Entries Found</Text>
        <Text style={styles.emptySubtitle}>
          Track money you lend to friends or borrow from them in one place.
        </Text>
        <TouchableOpacity style={styles.emptyAddButton} onPress={onAddNew} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.emptyAddButtonText}>Add Loan Entry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.tableWrapper}>
      {/* Table Header Row */}
      <View style={styles.tableHeader}>
        <Text style={[styles.thText, { flex: 2 }]}>PARTICIPANT</Text>
        <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
        <Text style={[styles.thText, { flex: 1.3, textAlign: 'center' }]}>STATUS</Text>
        <Text style={[styles.thText, { flex: 0.4 }]}></Text>
      </View>

      {/* Table Rows */}
      {loans.map((loan) => {
        const isLender = loan.lender_id === currentUserId;
        const friendName = isLender
          ? loan.borrower_display_name || loan.borrower_username
          : loan.lender_display_name || loan.lender_username;
        const friendPhone = isLender ? loan.borrower_phone : loan.lender_phone;
        const remaining = parseFloat(loan.remaining_balance || loan.principal_amount);

        return (
          <TouchableOpacity
            key={loan.id}
            style={[
              styles.tableRow,
              loan.is_overdue && loan.status !== 'REPAID' && styles.rowOverdueHighlight,
            ]}
            onPress={() => onSelectLoan(loan)}
            activeOpacity={0.7}
          >
            {/* Participant Column */}
            <View style={[styles.col, { flex: 2 }]}>
              <View style={styles.participantRow}>
                <View
                  style={[
                    styles.rolePill,
                    isLender ? styles.roleLent : styles.roleBorrowed,
                  ]}
                >
                  <Ionicons
                    name={isLender ? 'arrow-up' : 'arrow-down'}
                    size={11}
                    color={isLender ? colors.primary : '#38BDF8'}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      { color: isLender ? colors.primary : '#38BDF8' },
                    ]}
                  >
                    {isLender ? 'Lent to' : 'Borrowed'}
                  </Text>
                </View>
              </View>

              <Text style={styles.friendName} numberOfLines={1}>
                {friendName}
              </Text>
              <Text style={styles.dueText}>Due {formatDate(loan.due_date)}</Text>
            </View>

            {/* Amount Column */}
            <View style={[styles.col, { flex: 1.5, alignItems: 'flex-end' }]}>
              <Text
                style={[
                  styles.principalAmount,
                  isLender ? { color: colors.text } : { color: '#38BDF8' },
                ]}
              >
                ₹{Number(loan.principal_amount).toLocaleString('en-IN')}
              </Text>
              {loan.status !== 'REPAID' && remaining > 0 ? (
                <Text style={styles.remainingText}>
                  ₹{remaining.toLocaleString('en-IN')} left
                </Text>
              ) : (
                <Text style={[styles.remainingText, { color: colors.success }]}>
                  Fully settled
                </Text>
              )}
            </View>

            {/* Status Column */}
            <View style={[styles.col, { flex: 1.3, alignItems: 'center' }]}>
              {getStatusBadge(loan.status, loan.is_overdue)}
            </View>

            {/* Arrow */}
            <View style={[styles.col, { flex: 0.4, alignItems: 'flex-end' }]}>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tableWrapper: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  rowOverdueHighlight: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  col: {
    justifyContent: 'center',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  roleLent: {
    backgroundColor: colors.primaryLight,
  },
  roleBorrowed: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dueText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  principalAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusPartial: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  statusRepaid: {
    backgroundColor: colors.successLight,
  },
  statusOverdue: {
    backgroundColor: colors.dangerLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 36,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 20,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
