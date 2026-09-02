import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { Colors } from '../theme/colors';
import { useMemberAuth } from '../store/auth.context';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';

export const MemberLoginScreen = () => {
  const { t, i18n } = useTranslation();
  const { login } = useMemberAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError(t('auth.required', 'Please enter your Member ID (e.g. GP0002) and Password.'));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(identifier.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || t('auth.loginFailed', 'Login failed. Please check your credentials.'));
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>MEMBER PORTAL</Text>
          </View>
          <Text style={styles.appTitle}>GymPulse</Text>
          <Text style={styles.subtitle}>{t('auth.enterDetails', 'Welcome back! Enter your details to view your membership pass & classes.')}</Text>
        </View>

        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Input
            label={t('members.memberID', 'Member ID / Phone Number')}
            placeholder="e.g. GP0002 or 9876543210"
            value={identifier}
            onChangeText={(v) => {
              setIdentifier(v);
              if (error) setError(null);
            }}
            autoCapitalize="none"
          />

          <Input
            label={t('auth.password', 'Password')}
            placeholder="Enter your member password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError(null);
            }}
            isPassword
          />

          <Button
            title={`${t('auth.login', 'Log In to Member App')} ⚡`}
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />
        </View>

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
  container: {
    flex: 1,
    backgroundColor: Colors.slate900,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badgeBox: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.surface,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.slate400,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 8,
  },
});
