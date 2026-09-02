import React, { ReactNode } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: ReactNode;
  dark?: boolean;
}

export const Header = ({ title, subtitle, onBack, rightElement, dark = false }: HeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.backIcon, dark && styles.textWhite]}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleBox}>
          <Text style={[styles.title, dark && styles.textWhite]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, dark && styles.textSubWhite]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightElement ? <View style={styles.rightSlot}>{rightElement}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 4,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    paddingHorizontal: 4,
  },
  backIcon: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.slate900,
    lineHeight: 32,
  },
  titleBox: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.slate900,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 2,
  },
  textWhite: {
    color: Colors.surface,
  },
  textSubWhite: {
    color: Colors.slate400,
  },
  rightSlot: {
    marginLeft: 12,
  },
});
