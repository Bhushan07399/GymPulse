/**
 * obo Unified Mobile App — Login Screen
 * Unified authentication entry point with explicit Owner/Staff vs Member Pass intent selector.
 * Single source of truth: Owner Web visual language (Slate SaaS).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useAuth } from '../store/auth.context';
import {
  ScreenContainer,
  Input,
  PasswordInput,
  Button,
} from '../components/common';
import { Colors, Radius, Spacing, Typography, Shadows } from '../theme';

type LoginIntent = 'owner_staff' | 'member';

export const LoginScreen = () => {
  const { loginOwnerOrStaff, loginMember } = useAuth();

  const [intent, setIntent] = useState<LoginIntent>('owner_staff');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleIntentChange = (newIntent: LoginIntent) => {
    if (newIntent !== intent) {
      setIntent(newIntent);
      setError(null);
      setPassword('');
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    if (intent === 'owner_staff') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setLoading(true);
      try {
        await loginOwnerOrStaff({ email: email.trim(), password });
      } catch (err: any) {
        setError(err.message || 'Invalid credentials. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!identifier.trim()) {
        setError('Please enter your Member ID or registered phone number.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setLoading(true);
      try {
        await loginMember({ identifier: identifier.trim(), password });
      } catch (err: any) {
        setError(err.message || 'Invalid credentials. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScreenContainer scrollable keyboardAvoiding contentContainerStyle={styles.container}>
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Smart Gym Management Software</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Intent Segmented Selector */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentTab,
                intent === 'owner_staff' && styles.segmentTabActive,
              ]}
              onPress={() => handleIntentChange('owner_staff')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  intent === 'owner_staff' && styles.segmentTextActive,
                ]}
              >
                Owner / Staff
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentTab,
                intent === 'member' && styles.segmentTabActive,
              ]}
              onPress={() => handleIntentChange('member')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  intent === 'member' && styles.segmentTextActive,
                ]}
              >
                Member Pass
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Context Hint */}
          <Text style={styles.contextHint}>
            {intent === 'owner_staff'
              ? 'Access dashboard, operations, and reception portal'
              : 'Access your digital pass, workouts, and class schedules'}
          </Text>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Fields */}
          {intent === 'owner_staff' ? (
            <Input
              label="Email Address"
              placeholder="owner@yourgym.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          ) : (
            <Input
              label="Member ID or Phone"
              placeholder="e.g. GP0001 or 9876543210"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          )}

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />

          {/* Action Button */}
          <Button
            title={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Protected by obo Enterprise Security
          </Text>
        </View>
      </ScreenContainer>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 180,
    height: 60,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.container,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  segmentTabActive: {
    backgroundColor: Colors.surface,
    ...Shadows.xs,
  },
  segmentText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  contextHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBgSubtle,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorIcon: {
    marginRight: Spacing.sm,
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    ...Typography.caption,
    color: Colors.dangerText,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSubtle,
  },
});
