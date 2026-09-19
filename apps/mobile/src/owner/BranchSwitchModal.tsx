/**
 * obo Mobile — BranchSwitchModal Component
 * Multi-Gym branch switcher for authenticated gym owners.
 * Calls authoritative GET /auth/my-gyms and POST /auth/switch-gym.
 */

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Building, CheckCircle, ChevronRight } from 'lucide-react-native';
import { Button, StatusBadge } from '../components/common';
import { useAuth } from '../store/auth.context';
import { ownerService } from '../api';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { GymLocation } from '../types';

export interface BranchSwitchModalProps {
  visible: boolean;
  onClose: () => void;
  onSwitched?: (gym: GymLocation) => void;
}

export const BranchSwitchModal = ({
  visible,
  onClose,
  onSwitched,
}: BranchSwitchModalProps) => {
  const { session, switchGymSession } = useAuth();
  const queryClient = useQueryClient();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const { data: gyms = [], isLoading, error, refetch } = useQuery({
    queryKey: ['myGymLocations'],
    queryFn: () => ownerService.getMyGyms(),
    enabled: visible,
  });

  const handleSwitch = async (gym: GymLocation) => {
    if (gym.id === session?.gymId) {
      onClose();
      return;
    }

    setSwitchingId(gym.id);

    try {
      // 1. Post to backend to get new signed JWT scoped to the new gym
      const result = await ownerService.switchGym(gym.id);

      // 2. Update session in secure store and AuthContext
      await switchGymSession(result.token, result.gym);

      // 3. Reset TanStack Query cache so all tenant data is flushed and refreshed
      await queryClient.resetQueries();

      Alert.alert(
        'Branch Switched',
        `Active branch switched to ${result.gym.name}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              if (onSwitched) onSwitched(result.gym);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Switch Failed', err.message || 'Unable to switch branch.');
    } finally {
      setSwitchingId(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topTitle}>Switch Gym Branch</Text>
            <Text style={styles.topSubtitle}>Multi-Gym Locations</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionHeader}>Your Authorized Locations</Text>
          <Text style={styles.desc}>
            Selecting a branch updates your session security token and loads location-scoped data.
          </Text>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Fetching authorized locations...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{(error as Error).message}</Text>
              <Button title="Retry" onPress={() => refetch()} size="sm" style={{ marginTop: Spacing.md }} />
            </View>
          ) : gyms.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>No additional branch locations found.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {gyms.map((g) => {
                const isCurrent = g.id === session?.gymId || g.isCurrent;
                const isThisSwitching = switchingId === g.id;

                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.branchCard, isCurrent && styles.branchCardActive]}
                    onPress={() => handleSwitch(g)}
                    disabled={isThisSwitching}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconBox}>
                      <Building size={20} color={isCurrent ? '#FFFFFF' : Colors.textPrimary} />
                    </View>

                    <View style={styles.info}>
                      <View style={styles.nameRow}>
                        <Text style={styles.branchName} numberOfLines={1}>
                          {g.name}
                        </Text>
                        {isCurrent ? (
                          <StatusBadge variant="active" label="Current" size="sm" />
                        ) : null}
                      </View>
                      <Text style={styles.planText}>
                        {g.subscriptionPlan || 'Growth Plan'} • {g.subscriptionStatus || 'Active'}
                      </Text>
                    </View>

                    {isThisSwitching ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : isCurrent ? (
                      <CheckCircle size={20} color={Colors.success} />
                    ) : (
                      <ChevronRight size={18} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  sectionHeader: {
    ...Typography.sectionTitle,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  desc: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  centerBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    textAlign: 'center',
  },
  list: {
    gap: Spacing.sm,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  branchCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.containerSubtle,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  branchName: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    flex: 1,
  },
  planText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
