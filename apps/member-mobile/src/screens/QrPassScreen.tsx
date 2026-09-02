import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { memberCardService } from '../services/card.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { QrPassModalCard } from '../components/member/QrPassModalCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

export const QrPassScreen = () => {
  const { t } = useTranslation();
  const { data: card, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['digitalCard'],
    queryFn: () => memberCardService.getDigitalCard(),
  });

  return (
    <ScreenContainer onRefresh={refetch} refreshing={isRefetching}>
      <Header
        title={t('qrPass.title', 'Digital QR Pass')}
        subtitle={t('qrPass.showAtReception', 'Scan at gym reception for instant entry')}
      />

      {isLoading ? (
        <LoadingState message={t('common.loading', 'Generating high-contrast QR pass...')} />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : card ? (
        <View style={styles.centerWrapper}>
          <QrPassModalCard card={card} />
        </View>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerWrapper: {
    paddingVertical: 12,
  },
});
