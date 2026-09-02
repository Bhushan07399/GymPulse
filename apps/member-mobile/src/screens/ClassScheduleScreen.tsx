import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { Colors } from '../theme/colors';
import { memberClassesService } from '../services/classes.service';
import { AvailableGroupClass } from '../types/class';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { ClassScheduleCard } from '../components/member/ClassScheduleCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';

export const ClassScheduleScreen = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);

  const { data: classes, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['browseClasses'],
    queryFn: () => memberClassesService.browseClasses(),
  });

  const bookMutation = useMutation({
    mutationFn: async (cls: AvailableGroupClass) => {
      const sessionId = cls.schedule && cls.schedule.length > 0 ? cls.schedule[0].id : 'default-session';
      return await memberClassesService.bookClass(cls.id, sessionId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['browseClasses'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      Alert.alert(t('classes.bookingConfirmed', 'Session Booked! 🎉'), `Your spot in "${data.className || 'Class'}" is confirmed.`);
    },
    onError: (err: any) => {
      Alert.alert(t('common.error', 'Booking Error'), err.message || 'Could not complete class booking. Please try again.');
    },
    onSettled: () => {
      setBookingClassId(null);
    },
  });

  const handleBook = (cls: AvailableGroupClass) => {
    setBookingClassId(cls.id);
    bookMutation.mutate(cls);
  };

  const classList = classes || [];

  return (
    <ScreenContainer scrollable={false}>
      <Header
        title={t('classes.title', 'Group Classes')}
        subtitle={t('classes.browseClasses', 'Reserve your spot for daily workout sessions')}
      />

      {isLoading ? (
        <LoadingState message={t('common.loading', 'Loading class schedule...')} />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : classList.length === 0 ? (
        <EmptyState
          icon="🧘"
          title={t('classes.noClasses', 'No Classes Scheduled')}
          description="There are currently no active group class sessions scheduled for your gym."
        />
      ) : (
        <FlatList
          data={classList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClassScheduleCard
              item={item}
              onBook={handleBook}
              bookingLoading={bookingClassId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
});
