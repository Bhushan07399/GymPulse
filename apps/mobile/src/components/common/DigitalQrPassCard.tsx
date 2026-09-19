/**
 * obo Mobile Design System — DigitalQrPassCard Component
 * Displays the member's real signed digital QR pass with live validity state.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export interface DigitalQrPassCardProps {
  memberId: string;
  memberName: string;
  gymName: string;
  planName: string;
  expiryDate: string;
  qrToken: string;
  isActive: boolean;
  style?: ViewStyle;
}

export const DigitalQrPassCard = ({
  memberId,
  memberName,
  gymName,
  planName,
  expiryDate,
  qrToken,
  isActive,
  style,
}: DigitalQrPassCardProps) => {
  const isExpired = !isActive || (expiryDate && new Date(expiryDate) < new Date());

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.brandName}>obo</Text>
          <Text style={styles.gymName} numberOfLines={1}>
            {gymName}
          </Text>
        </View>
        <StatusBadge
          variant={isExpired ? 'expired' : 'active'}
          label={isExpired ? 'Expired' : 'Active Pass'}
        />
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrWrapper}>
          {qrToken ? (
            <QRCode
              value={qrToken}
              size={180}
              color={Colors.textPrimary}
              backgroundColor={Colors.surface}
            />
          ) : (
            <View style={styles.placeholderQr} />
          )}
        </View>
        <Text style={styles.scanHint}>
          Present at reception desk or scan gym entry code
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>MEMBER NAME</Text>
          <Text style={styles.footerValue} numberOfLines={1}>
            {memberName}
          </Text>
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>MEMBER ID</Text>
          <Text style={styles.footerValueMono} numberOfLines={1}>
            {memberId}
          </Text>
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>VALID UNTIL</Text>
          <Text style={[styles.footerValue, isExpired ? styles.textExpired : null]}>
            {expiryDate ? expiryDate.split('T')[0] : 'N/A'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: Spacing.lg,
  },
  brandName: {
    ...Typography.badge,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  gymName: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  qrWrapper: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderQr: {
    width: 180,
    height: 180,
    backgroundColor: Colors.container,
  },
  scanHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: Spacing.md,
  },
  footerCol: {
    flex: 1,
  },
  footerLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  footerValue: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  footerValueMono: {
    ...Typography.mono,
    fontSize: 12,
  },
  textExpired: {
    color: Colors.danger,
  },
});
