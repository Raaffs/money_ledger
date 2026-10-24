import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { loansApi } from '../api/loans';
import { Loan } from '../types/index';

interface CreateLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newLoan: Loan) => void;
}

export const CreateLoanModal: React.FC<CreateLoanModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [borrowerIdentifier, setBorrowerIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const getFutureDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleCreate = async () => {
    setError(null);

    if (!borrowerIdentifier.trim()) {
      setError('Please enter the friend\'s username or phone number');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid loan amount greater than 0');
      return;
    }

    if (!dueDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      setError('Due date must be in YYYY-MM-DD format');
      return;
    }

    setLoading(true);

    try {
      let targetBorrower = borrowerIdentifier.trim();
      const cleanDigits = targetBorrower.replace(/\D/g, '');

      // If user entered a 10-digit number without country code, append +91
      if (/^\d{10}$/.test(targetBorrower) || (cleanDigits.length === 10 && !/[a-zA-Z]/.test(targetBorrower))) {
        targetBorrower = `+91${cleanDigits}`;
      }

      const created = await loansApi.createLoan({
        borrowerIdentifier: targetBorrower,
        amount: numAmount,
        dueDate: dueDate.trim(),
        notes: notes.trim() || undefined,
      });

      // Reset fields
      setBorrowerIdentifier('');
      setAmount('');
      setDueDate('');
      setNotes('');
      onSuccess(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create loan. Please check friend\'s username/phone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Lend Money to Friend</Text>
              <Text style={styles.subtitle}>Record a new loan entry</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Friend Identifier */}
            <Text style={styles.label}>Friend's Username or Phone</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="e.g. alice_cooper or +919876543210"
                placeholderTextColor={colors.textMuted}
                value={borrowerIdentifier}
                onChangeText={(t) => {
                  setBorrowerIdentifier(t);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
              />
            </View>

            {/* Amount */}
            <Text style={styles.label}>Amount to Lend (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="1000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);
                  if (error) setError(null);
                }}
              />
            </View>

            {/* Due Date */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(!showCalendar)}
                style={styles.calendarToggleBtn}
              >
                <Ionicons
                  name={showCalendar ? 'calendar' : 'calendar-outline'}
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.calendarToggleText}>
                  {showCalendar ? 'Hide Calendar' : 'Open Calendar'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowCalendar(!showCalendar)}
              style={styles.inputBox}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="2026-11-15"
                placeholderTextColor={colors.textMuted}
                value={dueDate}
                onChangeText={(t) => {
                  setDueDate(t);
                  if (error) setError(null);
                }}
              />
              <Ionicons
                name={showCalendar ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {/* Embedded Calendar Component */}
            {showCalendar && (
              <View style={styles.calendarCard}>
                <Calendar
                  theme={{
                    backgroundColor: colors.surface,
                    calendarBackground: colors.surface,
                    textSectionTitleColor: colors.textSecondary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.textMuted,
                    arrowColor: colors.primary,
                    monthTextColor: colors.text,
                    indicatorColor: colors.primary,
                    textMonthFontWeight: 'bold',
                    textDayFontSize: 13,
                    textMonthFontSize: 14,
                    textDayHeaderFontSize: 11,
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                  onDayPress={(day: any) => {
                    setDueDate(day.dateString);
                    setShowCalendar(false);
                    if (error) setError(null);
                  }}
                  markedDates={
                    dueDate
                      ? {
                          [dueDate]: {
                            selected: true,
                            selectedColor: colors.primary,
                          },
                        }
                      : {}
                  }
                />
              </View>
            )}

            {/* Quick Date Chips */}
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => {
                  setDueDate(getFutureDate(7));
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.chipText}>In 7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => {
                  setDueDate(getFutureDate(15));
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.chipText}>In 15 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => {
                  setDueDate(getFutureDate(30));
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.chipText}>In 30 Days</Text>
              </TouchableOpacity>
            </View>

            {/* Notes / Reason */}
            <Text style={styles.label}>Note / Purpose (Optional)</Text>
            <View style={[styles.inputBox, { height: 74, alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="e.g. Dinner bill, trip advance, rent share..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Confirm & Create Loan</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    paddingBottom: 24,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  calendarToggleText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 16,
    padding: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 48,
    gap: 10,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -8,
    marginBottom: 18,
  },
  chip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  chipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
