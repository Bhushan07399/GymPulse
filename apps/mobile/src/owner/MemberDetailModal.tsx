/**
 * obo Mobile — MemberDetailModal Component
 * Full profile view for a selected member with status, dues, and collect payment shortcut.
 */

import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X, Phone, Mail, Calendar, CreditCard, Clock } from 'lucide-react-native';
import { Card, Button, StatusBadge } from '../components/common';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Member } from '../types';

export interface MemberDetailModalProps {
  visible: boolean;
  member: Member | null;
  onClose: () => void;
  onCollectPayment?: (member: Member) => void;
}

export const MemberDetailModal = ({
  visible,
  member,
  onClose,
  onCollectPayment,
}: MemberDetailModalProps) => {
  if (!visible || !member) return null;

  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'M';
  const isExpired = !member.isActive || (member.expiryDate && new Date(member.expiryDate) < new Date());
  const hasOutstanding = Number(member.outstandingAmount) > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topTitle}>Member Profile</Text>
            <Text style={styles.topSubtitle}>ID: {member.memberId || 'N/A'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* PROFILE HEADER CARD */}
          <Card style={styles.headerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.memberName}>
              {member.firstName} {member.lastName}
            </Text>
            <View style={styles.statusRow}>
              <StatusBadge
                variant={isExpired ? 'expired' : 'active'}
                label={isExpired ? 'Membership Expired' : 'Active Member'}
              />
            </View>
          </Card>

          {/* CONTACT DETAILS */}
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Phone size={18} color={Colors.textMuted} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{member.phone}</Text>
              </View>
            </View>

            {member.email ? (
              <View style={styles.infoRow}>
                <Mail size={18} color={Colors.textMuted} />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{member.email}</Text>
                </View>
              </View>
            ) : null}

            {member.gender ? (
              <View style={styles.infoRow}>
                <Clock size={18} color={Colors.textMuted} />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{member.gender}</Text>
                </View>
              </View>
            ) : null}
          </Card>

          {/* MEMBERSHIP PLAN & EXPIRY */}
          <Text style={styles.sectionTitle}>Membership Plan</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <CreditCard size={18} color={Colors.textMuted} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Plan Name</Text>
                <Text style={styles.infoValue}>{member.membershipPlanName || 'Standard'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Calendar size={18} color={Colors.textMuted} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Expiry Date</Text>
                <Text style={[styles.infoValue, isExpired ? styles.textDanger : null]}>
                  {member.expiryDate ? member.expiryDate.split('T')[0] : 'N/A'}
                </Text>
              </View>
            </View>

            {member.joinDate ? (
              <View style={styles.infoRow}>
                <Calendar size={18} color={Colors.textMuted} />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Join Date</Text>
                  <Text style={styles.infoValue}>{member.joinDate.split('T')[0]}</Text>
                </View>
              </View>
            ) : null}
          </Card>

          {/* OUTSTANDING DUES & PAYMENT ACTION */}
          <Text style={styles.sectionTitle}>Financial Account</Text>
          <Card style={[styles.infoCard, hasOutstanding ? styles.cardWarning : null]}>
            <View style={styles.dueRow}>
              <View>
                <Text style={styles.infoLabel}>Outstanding Balance</Text>
                <Text style={[styles.dueAmount, hasOutstanding ? styles.textDanger : styles.textSuccess]}>
                  ₹{member.outstandingAmount || 0}
                </Text>
              </View>

              {onCollectPayment ? (
                <Button
                  title="Collect Payment"
                  size="sm"
                  onPress={() => {
                    onClose();
                    onCollectPayment(member);
                  }}
                />
              ) : null}
            </View>
          </Card>

          {member.notes ? (
            <>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Card style={styles.infoCard}>
                <Text style={styles.notesText}>{member.notes}</Text>
              </Card>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topTitle: {
    ...Typography.pageTitle,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  topSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  headerCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    ...Typography.pageTitle,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  memberName: {
    ...Typography.pageTitle,
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statusRow: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  infoCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  infoCol: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  infoValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  textDanger: {
    color: Colors.danger,
  },
  textSuccess: {
    color: Colors.success,
  },
  cardWarning: {
    borderColor: Colors.dangerBorder,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dueAmount: {
    ...Typography.pageTitle,
    fontSize: 22,
    marginTop: 2,
  },
  notesText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
