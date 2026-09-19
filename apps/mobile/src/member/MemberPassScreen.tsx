/**
 * obo Mobile — Member Pass Screen
 * Displays member's real signed digital QR pass for reception check-in.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react-native';
import { memberService } from '../api';
import {
  ScreenContainer,
  Header,
  DigitalQrPassCard,
  LoadingState,
  ErrorState,
} from '../components/common';
import { Colors, Spacing, Typography, Radius } from '../theme';

export const MemberPassScreen = () => {
  const {
    data: card,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['memberDigitalCard'],
    queryFn: () => memberService.getDigitalCard(),
  });

  return (
    <ScreenContainer scrollable refreshing={isRefetching} onRefresh={refetch}>
      {/* HEADER */}
      <Header
        title="Digital QR Pass"
        subtitle="Your official gym membership access code"
      />

      <View style={styles.content}>
        {isLoading ? (
          <LoadingState message="Generating your digital pass..." />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={refetch} />
        ) : card ? (
          <>
            <DigitalQrPassCard
              memberId={card.memberId}
              memberName={card.name}
              gymName={card.gymName}
              planName={card.status || 'Active Pass'}
              expiryDate={card.expiryDate}
              qrToken={card.qrToken}
              isActive={card.status === 'Active'}
            />

            {/* INSTRUCTIONS */}
            <View style={styles.infoBanner}>
              <Info size={20} color={Colors.textMuted} />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>How to use your pass</Text>
                <Text style={styles.infoDesc}>
                  Hold your screen up to the scanner camera at the reception desk to register your check-in. Make sure screen brightness is turned up.
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.md,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.container,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTextWrap: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  infoTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  infoDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
