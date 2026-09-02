import React, { ReactNode } from 'react';
import { StyleSheet, View, ScrollView, ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../theme/colors';

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  darkHeader?: boolean;
}

export const ScreenContainer = ({
  children,
  style,
  contentContainerStyle,
  scrollable = true,
  onRefresh,
  refreshing = false,
  darkHeader = false,
}: ScreenContainerProps) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <StatusBar style={darkHeader ? 'light' : 'dark'} />
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
