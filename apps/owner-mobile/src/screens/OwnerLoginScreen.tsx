import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { Colors } from '../theme/colors';
import { useAuth } from '../store/auth.context';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';

export const OwnerLoginScreen = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [langModalVisible, setLangModalVisible] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError(t('auth.required', 'Please enter your email or username'));
      return;
    }
    if (!password) {
      setError(t('auth.required', 'Please enter your password'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || t('auth.invalidCredentials', 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const getLangLabel = () => {
    const code = i18n.language || 'en';
    if (code === 'hi') return 'हिंदी';
    if (code === 'mr') return 'मराठी';
    return 'English';
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.topRightLang}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.langBtnText}>🌐 {getLangLabel()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>GP</Text>
          </View>
          <Text style={styles.title}>GymPulse Owner</Text>
          <Text style={styles.subtitle}>Management & Reception Desk Portal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('auth.signIn', 'Sign in to your Gym')}</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label={t('auth.emailOrUsername', 'Email or Username')}
            placeholder="owner@gympulse.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label={t('auth.password', 'Password')}
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry
          />

          <Button
            title={t('auth.signin', 'Sign In to Management')}
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>

        <Text style={styles.footerText}>GymPulse SaaS • Production Management App</Text>

        <LanguageSelectorModal
          visible={langModalVisible}
          onClose={() => setLangModalVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  topRightLang: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  langBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  langBtnText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.slate900,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.slate900,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.surface,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.slate400,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 18,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 10,
  },
  footerText: {
    textAlign: 'center',
    color: Colors.slate500,
    fontSize: 12,
    marginTop: 24,
  },
});
