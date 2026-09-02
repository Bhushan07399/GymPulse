import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../lib/i18n';
import { Colors } from '../theme/colors';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal = ({ visible, onClose }: LanguageSelectorModalProps) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
  ] as const;

  const handleSelect = async (code: 'en' | 'hi' | 'mr') => {
    await changeLanguage(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{t('language.selectLanguage', 'Select Language')}</Text>
          <Text style={styles.subtitle}>
            {t('language.languageSubtitle', 'Select your preferred language to continue')}
          </Text>

          <View style={styles.options}>
            {languages.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langItem, isSelected && styles.langItemSelected]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langNative, isSelected && styles.langTextSelected]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langLabel, isSelected && styles.langTextSelected]}>
                    {lang.label}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeText}>{t('common.close', 'Close')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.slate500,
    marginBottom: 20,
  },
  options: {
    gap: 10,
    marginBottom: 16,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.slate100,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  langNative: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
    marginRight: 8,
  },
  langLabel: {
    fontSize: 13,
    color: Colors.slate500,
    flex: 1,
  },
  langTextSelected: {
    color: Colors.primary,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.slate100,
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate700,
  },
});
