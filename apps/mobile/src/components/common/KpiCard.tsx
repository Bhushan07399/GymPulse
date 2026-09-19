/**
 * obo Mobile Design System — KpiCard Component
 * Metric display card conforming to Owner Web Slate Monochrome specifications.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Card } from './Card';
import { Colors, Typography, Spacing } from '../../theme';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badgeText?: string;
  badgeVariant?: 'active' | 'warning' | 'danger' | 'info' | 'inactive';
  style?: ViewStyle;
}

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  badgeText,
  style,
}: KpiCardProps) => {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {icon ? <View style={styles.iconBox}>{icon}</View> : null}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  iconBox: {
    marginLeft: Spacing.xs,
  },
  value: {
    ...Typography.pageTitle,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
});
