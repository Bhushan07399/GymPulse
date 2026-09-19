/**
 * obo Mobile Design System — GymQrScannerModal Component
 * Full-screen camera modal for scanning entry QR codes and member passes.
 * Uses modern expo-camera CameraView with permission handling and manual fallback.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react-native';
import { Button } from './Button';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export interface GymQrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (qrData: string) => Promise<{ success: boolean; message?: string }>;
  title?: string;
  subtitle?: string;
}

export const GymQrScannerModal = ({
  visible,
  onClose,
  onScan,
  title = 'Scan QR Code',
  subtitle = 'Align the QR code within the frame to check in',
}: GymQrScannerModalProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (visible) {
      setFeedback(null);
      setIsScanning(false);
      setManualCode('');
    }
  }, [visible]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isScanning || feedback) return;
    setIsScanning(true);
    setFeedback(null);

    try {
      const result = await onScan(data);
      if (result.success) {
        setFeedback({ type: 'success', message: result.message || 'Check-in confirmed!' });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: result.message || 'Scan rejected.' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to process QR code.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim() || isScanning) return;
    setIsScanning(true);
    setFeedback(null);

    try {
      const result = await onScan(manualCode.trim());
      if (result.success) {
        setFeedback({ type: 'success', message: result.message || 'Confirmed!' });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: result.message || 'Code rejected.' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to process code.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Camera viewport */}
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Camera size={48} color={Colors.textMuted} />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionDesc}>
              obo needs camera access to scan QR codes for attendance check-ins.
            </Text>
            <Button
              title="Enable Camera"
              onPress={requestPermission}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        ) : (
          <View style={styles.cameraBox}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={isScanning ? undefined : handleBarcodeScanned}
            />

            {/* Target reticle */}
            <View style={styles.overlay}>
              <View style={styles.scanReticle}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {isScanning ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* Feedback Banner */}
        {feedback ? (
          <View
            style={[
              styles.feedbackBanner,
              feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
            ]}
          >
            {feedback.type === 'success' ? (
              <CheckCircle size={20} color={Colors.success} />
            ) : (
              <AlertCircle size={20} color={Colors.danger} />
            )}
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </View>
        ) : null}

        {/* Manual Code Entry */}
        <View style={styles.bottomBar}>
          <Text style={styles.manualLabel}>Having trouble? Enter code manually:</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="e.g. GP0001"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.manualSubmitBtn}
              onPress={handleManualSubmit}
              disabled={isScanning || !manualCode.trim()}
            >
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: '#0F172A',
  },
  title: {
    ...Typography.pageTitle,
    fontSize: 18,
    color: '#FFFFFF',
  },
  subtitle: {
    ...Typography.caption,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  cameraBox: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanReticle: {
    width: 240,
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: '#0F172A',
  },
  permissionTitle: {
    ...Typography.sectionTitle,
    color: '#FFFFFF',
    marginTop: Spacing.md,
  },
  permissionDesc: {
    ...Typography.body,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  feedbackText: {
    ...Typography.bodyBold,
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
    flex: 1,
  },
  bottomBar: {
    padding: Spacing.lg,
    paddingBottom: 36,
    backgroundColor: '#0F172A',
  },
  manualLabel: {
    ...Typography.caption,
    color: '#94A3B8',
    marginBottom: Spacing.xs,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    ...Typography.mono,
    backgroundColor: '#1E293B',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  manualSubmitBtn: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: Radius.md,
    marginLeft: Spacing.sm,
  },
});
