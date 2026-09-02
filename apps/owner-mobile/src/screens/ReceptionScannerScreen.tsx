import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../theme/colors';
import { attendanceService } from '../services/attendance.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { Button } from '../components/ui/Button';
import { ScanQrResponse } from '../types/attendance';

interface ReceptionScannerScreenProps {
  navigation: any;
}

export const ReceptionScannerScreen = ({ navigation }: ReceptionScannerScreenProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'EXPIRED' | 'ERROR';
    message: string;
    member?: ScanQrResponse['member'];
  } | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanning) return;
    setScanned(true);
    setScanning(true);

    try {
      const response = await attendanceService.scanQrCode({ qrData: data });

      queryClient.invalidateQueries({ queryKey: ['todayLedger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      if (response.alreadyCheckedIn) {
        setScanResult({
          type: 'ALREADY_CHECKED_IN',
          message: response.message || 'Member already checked in today.',
          member: response.member,
        });
      } else {
        setScanResult({
          type: 'SUCCESS',
          message: response.message || 'Check-in successful!',
          member: response.member,
        });
      }
    } catch (err: any) {
      const errMsg = err.message || 'Invalid or unauthorized QR pass.';
      setScanResult({
        type: errMsg.toLowerCase().includes('expired') ? 'EXPIRED' : 'ERROR',
        message: errMsg,
      });
    } finally {
      setScanning(false);
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setScanned(false);
    setScanning(false);
  };

  if (!permission) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Reception Scanner" onBack={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Reception Scanner" onBack={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDesc}>
            GymPulse needs camera access to scan member digital QR passes at the reception desk.
          </Text>
          <Button title="Grant Camera Permission" onPress={requestPermission} style={styles.permBtn} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} style={styles.blackBg}>
      <Header
        title="Reception QR Scanner"
        subtitle="Point camera at member digital pass"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.cameraContainer}>
        {!scanned ? (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanTarget}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.guideText}>Center member QR pass inside frame</Text>
            </View>
          </CameraView>
        ) : (
          <View style={styles.resultContainer}>
            {scanning ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.validatingText}>Validating pass with backend...</Text>
              </View>
            ) : scanResult ? (
              <View
                style={[
                  styles.resultCard,
                  scanResult.type === 'SUCCESS' && styles.bgSuccess,
                  scanResult.type === 'ALREADY_CHECKED_IN' && styles.bgWarning,
                  (scanResult.type === 'EXPIRED' || scanResult.type === 'ERROR') && styles.bgDanger,
                ]}
              >
                <Text style={styles.resultIcon}>
                  {scanResult.type === 'SUCCESS'
                    ? '✅'
                    : scanResult.type === 'ALREADY_CHECKED_IN'
                    ? '⚠️'
                    : '❌'}
                </Text>

                <Text style={styles.resultTitle}>
                  {scanResult.type === 'SUCCESS'
                    ? 'CHECK-IN SUCCESSFUL'
                    : scanResult.type === 'ALREADY_CHECKED_IN'
                    ? 'ALREADY CHECKED IN'
                    : 'CHECK-IN REJECTED'}
                </Text>

                <Text style={styles.resultMessage}>{scanResult.message}</Text>

                {scanResult.member && (
                  <View style={styles.memberBox}>
                    <Text style={styles.memberName}>
                      {scanResult.member.firstName} {scanResult.member.lastName}
                    </Text>
                    <Text style={styles.memberMeta}>
                      ID: {scanResult.member.memberId} • {scanResult.member.membershipPlanName || 'Plan'}
                    </Text>
                  </View>
                )}

                <Button
                  title="Scan Next Pass 📷"
                  onPress={handleScanAgain}
                  style={styles.scanAgainBtn}
                />
              </View>
            ) : null}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  blackBg: {
    backgroundColor: Colors.slate900,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: Colors.slate400,
    marginTop: 12,
    fontSize: 14,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 13,
    color: Colors.slate500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  permBtn: {
    width: '100%',
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanTarget: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  guideText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(15,23,42,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.slate900,
  },
  loadingBox: {
    alignItems: 'center',
  },
  validatingText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  resultCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  bgSuccess: {
    backgroundColor: Colors.slate800,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  bgWarning: {
    backgroundColor: Colors.slate800,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  bgDanger: {
    backgroundColor: Colors.slate800,
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  resultIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.surface,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  resultMessage: {
    fontSize: 13,
    color: Colors.slate300,
    textAlign: 'center',
    marginBottom: 16,
  },
  memberBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.surface,
  },
  memberMeta: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  scanAgainBtn: {
    width: '100%',
  },
});
