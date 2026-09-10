import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../theme/colors';
import { memberAttendanceService } from '../../services/attendance.service';
import { ScanQrResult, EligibleClassSession } from '../../types/attendance';

interface GymQrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GymQrScannerModal = ({ visible, onClose, onSuccess }: GymQrScannerModalProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanQrResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [markingClassId, setMarkingClassId] = useState<string | null>(null);
  const [markedClasses, setMarkedClasses] = useState<Record<string, boolean>>({});

  const resetState = () => {
    setScanned(false);
    setLoading(false);
    setResult(null);
    setErrorMessage(null);
    setManualCode('');
    setCheckingOut(false);
    setMarkingClassId(null);
    setMarkedClasses({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processQrCode = async (rawCode: string) => {
    if (!rawCode || loading) return;
    setScanned(true);
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await memberAttendanceService.scanGymQr(rawCode.trim());
      setResult(res);
      if (res.action === 'CHECK_IN' && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to scan QR code.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned && !loading) {
      processQrCode(data);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      processQrCode(manualCode.trim());
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const res = await memberAttendanceService.checkOut();
      setResult({
        action: 'CHECK_OUT',
        status: 'CHECKED_OUT',
        checkInTime: result?.checkInTime,
        checkOutTime: res.checkOutTime || new Date().toISOString(),
        message: 'Successfully checked out!',
        eligibleClasses: result?.eligibleClasses || [],
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to check out.';
      setErrorMessage(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleMarkClassAttendance = async (session: EligibleClassSession) => {
    setMarkingClassId(session.sessionId);
    try {
      await memberAttendanceService.markClassAttendance(session.sessionId, session.classId);
      setMarkedClasses((prev) => ({ ...prev, [session.sessionId]: true }));
      Alert.alert('Class Attendance Marked', `You are marked present for ${session.className}.`);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to mark class attendance.';
      Alert.alert('Class Attendance Error', msg);
    } finally {
      setMarkingClassId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Gym Check-In</Text>
            <Text style={styles.headerSub}>Scan physical Gym QR Code</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        {!scanned ? (
          <View style={styles.scannerWrapper}>
            {!permission?.granted ? (
              <View style={styles.permissionBox}>
                <Text style={styles.permissionIcon}>📷</Text>
                <Text style={styles.permissionTitle}>Camera Access Required</Text>
                <Text style={styles.permissionDesc}>
                  GymPulse needs camera access to scan the gym's physical QR code for member check-in.
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
                  <Text style={styles.primaryBtnText}>Grant Camera Permission</Text>
                </TouchableOpacity>
              </View>
            ) : (
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
                  <Text style={styles.guideText}>Point camera at the Gym's QR code</Text>
                </View>
              </CameraView>
            )}

            {/* Manual Entry Fallback for testing / simulator */}
            <View style={styles.manualEntryContainer}>
              <Text style={styles.manualLabel}>Or enter Gym ID manually:</Text>
              <View style={styles.manualRow}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="e.g. GYMPULSE-GYM:<id> or UUID"
                  placeholderTextColor={Colors.slate400}
                  value={manualCode}
                  onChangeText={setManualCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.manualBtn, !manualCode.trim() && styles.disabledBtn]}
                  onPress={handleManualSubmit}
                  disabled={!manualCode.trim() || loading}
                >
                  <Text style={styles.manualBtnText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Verifying Gym QR...</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Check-In Failed</Text>
                <Text style={styles.errorDesc}>{errorMessage}</Text>

                <TouchableOpacity style={styles.retryBtn} onPress={resetState}>
                  <Text style={styles.retryBtnText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            ) : result ? (
              <View style={styles.resultCard}>
                {result.action === 'CHECK_IN' && (
                  <View style={styles.statusBoxSuccess}>
                    <Text style={styles.successIcon}>✓</Text>
                    <Text style={styles.statusTitle}>Checked In Successfully!</Text>
                    <Text style={styles.statusSub}>
                      {result.checkInTime
                        ? `Check-in recorded at ${new Date(result.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Welcome to the gym!'}
                    </Text>
                  </View>
                )}

                {result.action === 'DUPLICATE' && (
                  <View style={styles.statusBoxWarning}>
                    <Text style={styles.warningIcon}>ℹ️</Text>
                    <Text style={styles.statusTitle}>Already Checked In</Text>
                    <Text style={styles.statusSub}>
                      {result.checkInTime
                        ? `You checked in today at ${new Date(result.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
                        : "You're already checked in for today."}
                    </Text>
                    <TouchableOpacity
                      style={styles.checkoutActionBtn}
                      onPress={handleCheckOut}
                      disabled={checkingOut}
                    >
                      {checkingOut ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.checkoutActionBtnText}>🚪 Check Out Now</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {result.action === 'CHECK_OUT' && (
                  <View style={styles.statusBoxSuccess}>
                    <Text style={styles.successIcon}>✓</Text>
                    <Text style={styles.statusTitle}>Checked Out Successfully!</Text>
                    <Text style={styles.statusSub}>
                      {result.checkOutTime
                        ? `Session completed at ${new Date(result.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Have a great day!'}
                    </Text>
                  </View>
                )}

                {result.action === 'ALREADY_COMPLETED' && (
                  <View style={styles.statusBoxInfo}>
                    <Text style={styles.infoIcon}>👍</Text>
                    <Text style={styles.statusTitle}>Session Already Completed</Text>
                    <Text style={styles.statusSub}>
                      You have already completed your workout and checked out for today. See you next time!
                    </Text>
                  </View>
                )}

                {/* Eligible Classes Section */}
                {Boolean(result.eligibleClasses && result.eligibleClasses.length > 0) && (
                  <View style={styles.classesSection}>
                    <Text style={styles.classesSectionTitle}>🏋️ Today's Eligible Classes</Text>
                    <Text style={styles.classesSectionSub}>
                      You are eligible for the following session today. Mark attendance below:
                    </Text>

                    {result.eligibleClasses!.map((session) => {
                      const isMarked = markedClasses[session.sessionId] || session.alreadyAttended;
                      const isProcessing = markingClassId === session.sessionId;

                      return (
                        <View key={session.sessionId} style={styles.classCard}>
                          <View style={styles.classCardHeader}>
                            <View style={styles.classInfo}>
                              <Text style={styles.className}>{session.className}</Text>
                              <Text style={styles.classTime}>
                                ⏰ {session.startTime} - {session.endTime}
                              </Text>
                              {Boolean(session.instructorName) && (
                                <Text style={styles.classInstructor}>
                                  Instructor: {session.instructorName}
                                </Text>
                              )}
                            </View>

                            {isMarked ? (
                              <View style={styles.attendedBadge}>
                                <Text style={styles.attendedBadgeText}>✓ Attended</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.markClassBtn}
                                onPress={() => handleMarkClassAttendance(session)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <Text style={styles.markClassBtnText}>Mark Present</Text>
                                )}
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Footer Button */}
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  scannerWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTarget: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  guideText: {
    marginTop: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  manualEntryContainer: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  manualLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  manualBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  resultScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  resultContent: {
    padding: 20,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.slate700,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusBoxSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 36,
    color: '#059669',
    fontWeight: '900',
    marginBottom: 8,
  },
  statusBoxWarning: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statusBoxInfo: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate900,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 14,
    color: Colors.slate600,
    textAlign: 'center',
    lineHeight: 20,
  },
  checkoutActionBtn: {
    marginTop: 16,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  checkoutActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  classesSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.slate200,
    paddingTop: 16,
    marginBottom: 20,
  },
  classesSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
    marginBottom: 4,
  },
  classesSectionSub: {
    fontSize: 13,
    color: Colors.slate500,
    marginBottom: 12,
  },
  classCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
    marginRight: 10,
  },
  className: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  classTime: {
    fontSize: 13,
    color: Colors.slate600,
    marginTop: 2,
  },
  classInstructor: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  markClassBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  markClassBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  attendedBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  attendedBadgeText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 12,
  },
  resultActions: {
    marginTop: 8,
  },
  doneBtn: {
    backgroundColor: Colors.slate900,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
