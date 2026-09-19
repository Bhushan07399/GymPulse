/**
 * obo Mobile — Member Classes Screen
 * Group fitness class schedules, capacity tracking, booking, and cancellation.
 * Only available on the Gym + Classes plan (Growth and Pro do not include classes).
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Calendar, Clock, X, Lock } from 'lucide-react-native';
import { memberService } from '../api';
import {
  ScreenContainer,
  Header,
  Card,
  Button,
  StatusBadge,
  ClassScheduleCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../components/common';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { AvailableGroupClass, ClassBookingRecord } from '../types';

export const MemberClassesScreen = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'browse' | 'myBookings'>('browse');
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);

  const {
    data: classes = [],
    isLoading: loadingClasses,
    error: classesError,
    refetch: refetchClasses,
    isRefetching: refetchingClasses,
  } = useQuery({
    queryKey: ['browseClasses'],
    queryFn: () => memberService.browseClasses(),
  });

  const {
    data: myBookings,
    isLoading: loadingBookings,
    error: bookingsError,
    refetch: refetchBookings,
    isRefetching: refetchingBookings,
  } = useQuery({
    queryKey: ['myClassBookings'],
    queryFn: () => memberService.getMyBookings(),
    enabled: activeTab === 'myBookings',
  });

  const bookMutation = useMutation({
    mutationFn: ({ classId, sessionId }: { classId: string; sessionId: string }) =>
      memberService.bookClass(classId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browseClasses'] });
      queryClient.invalidateQueries({ queryKey: ['myClassBookings'] });
      Alert.alert('Class Booked!', 'Your spot in the group fitness class is reserved.');
    },
    onError: (err: any) => {
      Alert.alert('Booking Error', err.message || 'Unable to book class.');
    },
    onSettled: () => {
      setBookingClassId(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => memberService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browseClasses'] });
      queryClient.invalidateQueries({ queryKey: ['myClassBookings'] });
      Alert.alert('Booking Cancelled', 'Your spot has been released.');
    },
    onError: (err: any) => {
      Alert.alert('Cancellation Error', err.message || 'Unable to cancel booking.');
    },
  });

  const handleBook = (item: AvailableGroupClass) => {
    const sessionId = item.schedule?.[0]?.id || 'session-default';
    setBookingClassId(item.id);
    bookMutation.mutate({ classId: item.id, sessionId });
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert('Cancel Class Booking', 'Are you sure you want to cancel your reservation?', [
      { text: 'Keep Spot', style: 'cancel' },
      { text: 'Cancel Booking', style: 'destructive', onPress: () => cancelMutation.mutate(bookingId) },
    ]);
  };

  // Plan limitation check (Gym + Classes plan requirement)
  const isPlanRestricted =
    classesError &&
    ((classesError as any).response?.status === 403 ||
      (classesError as any).message?.toLowerCase().includes('plan') ||
      (classesError as any).message?.toLowerCase().includes('upgrade'));

  if (isPlanRestricted) {
    return (
      <ScreenContainer scrollable>
        <Header title="Group Classes" subtitle="Class Schedule & Bookings" />
        <View style={styles.restrictedContainer}>
          <View style={styles.lockCircle}>
            <Lock size={32} color={Colors.textMuted} />
          </View>
          <Text style={styles.restrictedTitle}>Gym + Classes Plan Required</Text>
          <Text style={styles.restrictedDesc}>
            Group fitness classes and schedules are available exclusively on the Gym + Classes plan.
            Growth and Pro plans include standard gym access only.
          </Text>
          <Text style={styles.upgradeHint}>
            Please contact your gym front desk to add group classes to your membership.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const upcomingBookings = myBookings?.upcoming || [];

  return (
    <ScreenContainer scrollable={false}>
      {/* HEADER */}
      <Header
        title="Group Classes"
        subtitle="Schedule & personal bookings"
      />

      {/* SEGMENTED TAB SWITCHER */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'browse' && styles.tabBtnActive]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
            Available Classes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'myBookings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('myBookings')}
        >
          <Text style={[styles.tabText, activeTab === 'myBookings' && styles.tabTextActive]}>
            My Bookings ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* BROWSE TAB */}
      {activeTab === 'browse' ? (
        loadingClasses ? (
          <LoadingState message="Loading class schedule..." />
        ) : classesError ? (
          <ErrorState message={(classesError as Error).message} onRetry={refetchClasses} />
        ) : classes.length === 0 ? (
          <EmptyState
            title="No Classes Scheduled"
            description="There are currently no group fitness classes scheduled at your gym."
          />
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ClassScheduleCard
                item={item}
                onBook={handleBook}
                isBooking={bookingClassId === item.id}
              />
            )}
            refreshing={refetchingClasses}
            onRefresh={refetchClasses}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
          />
        )
      ) : (
        /* MY BOOKINGS TAB */
        loadingBookings ? (
          <LoadingState message="Loading your bookings..." />
        ) : bookingsError ? (
          <ErrorState message={(bookingsError as Error).message} onRetry={refetchBookings} />
        ) : upcomingBookings.length === 0 ? (
          <EmptyState
            title="No Upcoming Bookings"
            description="You have not reserved any spots in upcoming classes."
            actionTitle="Browse Classes"
            onAction={() => setActiveTab('browse')}
          />
        ) : (
          <FlatList
            data={upcomingBookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: ClassBookingRecord }) => (
              <Card style={styles.bookingCard}>
                <View style={styles.bookingTop}>
                  <View>
                    <Text style={styles.bookingTitle}>{item.className}</Text>
                    <Text style={styles.bookingDate}>
                      {item.bookingDate} • {item.startTime} - {item.endTime}
                    </Text>
                  </View>
                  <StatusBadge variant="active" label={item.status || 'Confirmed'} size="sm" />
                </View>

                {item.instructorName ? (
                  <Text style={styles.instructorText}>Instructor: {item.instructorName}</Text>
                ) : null}

                <View style={styles.bookingActionRow}>
                  <Button
                    title="Cancel Booking"
                    variant="outline"
                    size="sm"
                    onPress={() => handleCancelBooking(item.id)}
                    loading={cancelMutation.isPending}
                  />
                </View>
              </Card>
            )}
            refreshing={refetchingBookings}
            onRefresh={refetchBookings}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
          />
        )
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.container,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  listPadding: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  restrictedContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  restrictedTitle: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  restrictedDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  upgradeHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  bookingCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  bookingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  bookingTitle: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  bookingDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  instructorText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  bookingActionRow: {
    marginTop: Spacing.md,
    alignItems: 'flex-end',
  },
});
