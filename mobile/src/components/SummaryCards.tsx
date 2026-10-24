import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { LoanSummary } from '../types/index';

interface SummaryCardsProps {
  summary: LoanSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const formatCurrency = (val: number) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.container}>
      {/* Total Lent */}
      <View style={[styles.card, styles.cardLent]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="arrow-up-circle-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.label}>Total Lent</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(summary.total_lent)}</Text>
        <Text style={styles.subtext}>Principal given</Text>
      </View>

      {/* Total Repaid */}
      <View style={[styles.card, styles.cardRepaid]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-done-circle-outline" size={18} color={colors.success} />
          </View>
          <Text style={styles.label}>Total Repaid</Text>
        </View>
        <Text style={[styles.amount, { color: colors.success }]}>
          {formatCurrency(summary.total_repaid)}
        </Text>
        <Text style={styles.subtext}>Repaid to others</Text>
      </View>

      {/* Overdue */}
      <View
        style={[
          styles.card,
          styles.cardOverdue,
          summary.overdue_amount > 0 && styles.cardOverdueActive,
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor:
                  summary.overdue_amount > 0 ? colors.dangerLight : 'rgba(255, 255, 255, 0.05)',
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={summary.overdue_amount > 0 ? colors.danger : colors.textMuted}
            />
          </View>
          <Text style={styles.label}>Overdue</Text>
        </View>
        <Text
          style={[
            styles.amount,
            { color: summary.overdue_amount > 0 ? colors.danger : colors.text },
          ]}
        >
          {formatCurrency(summary.overdue_amount)}
        </Text>
        <Text style={styles.subtext}>
          {summary.overdue_amount > 0 ? 'You owe others' : 'Nothing overdue'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardLent: {
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  cardRepaid: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cardOverdue: {},
  cardOverdueActive: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
