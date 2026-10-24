import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { loansApi } from '../api/loans';
import { Loan, LoanPayment } from '../types/index';

interface LoanDetailScreenProps {
  loanId: string;
  currentUserId: string;
  onBack: () => void;
  onLoanUpdated: () => void;
}

export const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({
  loanId,
  currentUserId,
  onBack,
  onLoanUpdated,
}) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [repayLoading, setRepayLoading] = useState(false);
  const [repayError, setRepayError] = useState<string | null>(null);

  const fetchLoan = async () => {
    try {
      setLoading(true);
      const data = await loansApi.getLoanById(loanId);
      setLoan(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [loanId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!loan || error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Loan not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLender = loan.lender_id === currentUserId;
  const friendName = isLender
    ? loan.borrower_display_name || loan.borrower_username
    : loan.lender_display_name || loan.lender_username;
  const friendPhone = isLender ? loan.borrower_phone : loan.lender_phone;
  const friendUsername = isLender ? loan.borrower_username : loan.lender_username;

  const principal = parseFloat(loan.principal_amount);
  const remaining = parseFloat(loan.remaining_balance || '0');
  const paid = parseFloat(loan.total_paid || '0');
  const percentRepaid = principal > 0 ? Math.min(100, Math.round((paid / principal) * 100)) : 0;

  const handleRepay = async () => {
    setRepayError(null);
    const amountNum = parseFloat(repayAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setRepayError('Please enter a valid repayment amount');
      return;
    }

    if (amountNum > remaining) {
      setRepayError(`Amount cannot exceed remaining balance of ₹${remaining.toFixed(2)}`);
      return;
    }

    setRepayLoading(true);

    try {
      const res = await loansApi.recordPayment(loan.id, {
        amount: amountNum,
        notes: repayNote.trim() || undefined,
      });

      setLoan(res.loan);
      setRepayAmount('');
      setRepayNote('');
      setRepayModalVisible(false);
      onLoanUpdated();
    } catch (err: any) {
      setRepayError(err.message || 'Failed to record repayment');
    } finally {
      setRepayLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBack} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.navBackText}>Loans</Text>
        </TouchableOpacity>

        {/* Status Pill */}
        <View
          style={[
            styles.statusPill,
            loan.status === 'REPAID'
              ? styles.statusPillRepaid
              : loan.is_overdue
              ? styles.statusPillOverdue
              : styles.statusPillPending,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              loan.status === 'REPAID'
                ? { color: colors.success }
                : loan.is_overdue
                ? { color: colors.danger }
                : { color: colors.warning },
            ]}
          >
            {loan.status === 'REPAID'
              ? 'Settled'
              : loan.is_overdue
              ? 'Overdue'
              : loan.status === 'PARTIALLY_PAID'
              ? 'Partially Paid'
              : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Participant Banner */}
      <View style={styles.participantCard}>
        <View style={styles.participantAvatar}>
          <Text style={styles.avatarLetter}>{friendName[0]?.toUpperCase() || 'F'}</Text>
        </View>
        <View style={styles.participantInfo}>
          <Text style={styles.directionText}>
            {isLender ? 'You lent money to' : 'You borrowed from'}
          </Text>
          <Text style={styles.participantName}>{friendName}</Text>
          <Text style={styles.participantHandle}>
            @{friendUsername} • {friendPhone}
          </Text>
        </View>
      </View>

      {/* Overdue Alert Banner if active */}
      {loan.is_overdue && loan.status !== 'REPAID' && (
        <View style={styles.overdueAlert}>
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <View style={styles.overdueTextGroup}>
            <Text style={styles.overdueAlertTitle}>This loan is overdue</Text>
            <Text style={styles.overdueAlertSubtitle}>
              Was due on {new Date(loan.due_date).toLocaleDateString('en-IN')}.
            </Text>
          </View>
        </View>
      )}

      {/* Financial Overview Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Remaining Balance</Text>
            <Text style={styles.remainingAmount}>₹{remaining.toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.balanceLabel}>Principal Amount</Text>
            <Text style={styles.principalText}>₹{principal.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${percentRepaid}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressSubtext}>Paid: ₹{paid.toLocaleString('en-IN')}</Text>
          <Text style={styles.progressSubtext}>{percentRepaid}% Settled</Text>
        </View>

        {/* Memo / Notes if present */}
        {loan.notes && (
          <View style={styles.memoBox}>
            <Ionicons name="document-text-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.memoText}>{loan.notes}</Text>
          </View>
        )}
      </View>

      {/* Repay Action Button */}
      {loan.status !== 'REPAID' && (
        <TouchableOpacity
          style={styles.repayButton}
          onPress={() => {
            setRepayAmount(remaining.toString());
            setRepayModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.repayButtonText}>
            {isLender ? 'Record Friend\'s Repayment' : 'Make Repayment (Partial / Full)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Payment History Timeline */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Repayment Installments</Text>
        <Text style={styles.sectionCount}>{loan.payments?.length || 0} Payments</Text>
      </View>

      {loan.payments && loan.payments.length > 0 ? (
        <View style={styles.timelineList}>
          {loan.payments.map((p, index) => (
            <View key={p.id} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentAmount}>+ ₹{parseFloat(p.amount).toLocaleString('en-IN')}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(p.paid_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                {p.notes ? <Text style={styles.paymentNote}>{p.notes}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyPayments}>
          <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyPaymentsText}>No payments recorded yet</Text>
        </View>
      )}

      {/* Repayment Installment Modal */}
      <Modal visible={repayModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Repayment</Text>
              <TouchableOpacity onPress={() => setRepayModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {repayError && (
              <View style={styles.modalError}>
                <Text style={styles.modalErrorText}>{repayError}</Text>
              </View>
            )}

            <Text style={styles.inputPrompt}>Enter Amount to Pay (₹)</Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={repayAmount}
                onChangeText={(t) => {
                  setRepayAmount(t);
                  if (repayError) setRepayError(null);
                }}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
            </View>

            {/* Quick Chips */}
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setRepayAmount(remaining.toString())}
              >
                <Text style={styles.chipText}>Full Balance (₹{remaining})</Text>
              </TouchableOpacity>
              {remaining > 200 && (
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => setRepayAmount(Math.round(remaining / 2).toString())}
                >
                  <Text style={styles.chipText}>50% (₹{Math.round(remaining / 2)})</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.inputPrompt}>Note / Payment Mode (Optional)</Text>
            <TextInput
              style={styles.modalNoteInput}
              placeholder="e.g. GPay, PhonePe, Cash, UPI Ref..."
              placeholderTextColor={colors.textMuted}
              value={repayNote}
              onChangeText={setRepayNote}
            />

            <TouchableOpacity
              style={[styles.confirmRepayBtn, repayLoading && styles.btnDisabled]}
              onPress={handleRepay}
              disabled={repayLoading}
            >
              {repayLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmRepayText}>Confirm Repayment</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  navBackText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillRepaid: {
    backgroundColor: colors.successLight,
  },
  statusPillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusPillOverdue: {
    backgroundColor: colors.dangerLight,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
    gap: 14,
  },
  participantAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantInfo: {
    flex: 1,
  },
  directionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  participantName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  participantHandle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  overdueTextGroup: {
    flex: 1,
  },
  overdueAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  overdueAlertSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  remainingAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  principalText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.inputBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressSubtext: {
    fontSize: 11,
    color: colors.textMuted,
  },
  memoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
    gap: 8,
  },
  memoText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 24,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  repayButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  timelineList: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  paymentDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  paymentNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  emptyPayments: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  emptyPaymentsText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalError: {
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  modalErrorText: {
    color: colors.danger,
    fontSize: 13,
  },
  inputPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  modalInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  chipText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  modalNoteInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    marginBottom: 20,
  },
  confirmRepayBtn: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmRepayText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
});
