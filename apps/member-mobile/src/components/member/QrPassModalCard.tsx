import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../theme/colors';
import { DigitalCardData } from '../../types/member';
import { StatusBadge } from '../ui/StatusBadge';

interface QrPassModalCardProps {
  card: DigitalCardData;
}

export const QrPassModalCard = ({ card }: QrPassModalCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.logoTitle}>GYMPULSE PASS</Text>
        <StatusBadge status={card.status} />
      </View>

      <Text style={styles.gymName}>📍 {card.gymName}</Text>

      <View style={styles.qrBox}>
        <QRCode
          value={card.qrToken || `GYMPULSE-MEMBER:${card.memberId}:${card.gymId}`}
          size={200}
          color={Colors.slate900}
          backgroundColor={Colors.surface}
        />
        <Text style={styles.scanNotice}>Show this QR at reception for instant check-in</Text>
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.memberName}>{card.name}</Text>
          <Text style={styles.memberId}>ID: {card.memberId}</Text>
        </View>
        <View style={styles.expiryBox}>
          <Text style={styles.expLabel}>VALID UNTIL</Text>
          <Text style={styles.expVal}>{card.expiryDate}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    shadowColor: Colors.slate900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  gymName: {
    fontSize: 13,
    color: Colors.slate500,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  qrBox: {
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.slate200,
    width: '100%',
    marginBottom: 20,
  },
  scanNotice: {
    fontSize: 12,
    color: Colors.slate600,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
  memberId: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '600',
    marginTop: 2,
  },
  expiryBox: {
    alignItems: 'flex-end',
  },
  expLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate400,
    letterSpacing: 0.5,
  },
  expVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate900,
    marginTop: 2,
  },
});
