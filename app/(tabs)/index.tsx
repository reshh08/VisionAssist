import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { Play, Square, Mic, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [currentMode, setCurrentMode] = useState<'indoor' | 'outdoor'>('indoor');
  const [isListening, setIsListening] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const detectionInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadSettings();
    announceAppReady();
  }, []);

  const loadSettings = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('detectionMode');
      if (savedMode) {
        setCurrentMode(savedMode as 'indoor' | 'outdoor');
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const announceAppReady = () => {
    Speech.speak('VisionAssist is ready. Tap start detection to begin, or use voice commands.', {
      language: 'en',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            VisionAssist needs camera access to help you identify objects and read text.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const startDetection = async () => {
    setIsDetecting(true);
    Speech.speak(`Starting ${currentMode} detection mode`);
    
    // Simulate object detection (in a real app, this would use ML models)
    detectionInterval.current = setInterval(() => {
      simulateObjectDetection();
    }, 3000);
  };

  const stopDetection = () => {
    setIsDetecting(false);
    setDetectedObjects([]);
    Speech.speak('Detection stopped');
    
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
  };

  const simulateObjectDetection = () => {
    const indoorObjects = ['Chair', 'Table', 'Lamp', 'Door', 'Window', 'Book', 'Cup', 'Phone'];
    const outdoorObjects = ['Car', 'Tree', 'Building', 'Person walking', 'Traffic light', 'Bench', 'Street sign'];
    
    const objects = currentMode === 'indoor' ? indoorObjects : outdoorObjects;
    const randomObject = objects[Math.floor(Math.random() * objects.length)];
    
    setDetectedObjects(prev => {
      const newObjects = [randomObject, ...prev.slice(0, 4)];
      Speech.speak(`Detected: ${randomObject}`);
      return newObjects;
    });
  };

  const toggleMode = async () => {
    const newMode = currentMode === 'indoor' ? 'outdoor' : 'indoor';
    setCurrentMode(newMode);
    await AsyncStorage.setItem('detectionMode', newMode);
    Speech.speak(`Switched to ${newMode} mode`);
  };

  const sendEmergencySOS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission is required for emergency features');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      Speech.speak('Emergency alert activated. Location captured.');
      
      Alert.alert(
        'Emergency SOS',
        `Emergency alert would be sent with location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Speech.speak('Unable to get location for emergency alert');
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('start') || lowerCommand.includes('begin')) {
      if (!isDetecting) startDetection();
    } else if (lowerCommand.includes('stop')) {
      if (isDetecting) stopDetection();
    } else if (lowerCommand.includes('indoor')) {
      setCurrentMode('indoor');
      Speech.speak('Switched to indoor mode');
    } else if (lowerCommand.includes('outdoor')) {
      setCurrentMode('outdoor');
      Speech.speak('Switched to outdoor mode');
    } else if (lowerCommand.includes('help') || lowerCommand.includes('emergency')) {
      sendEmergencySOS();
    } else {
      Speech.speak('Available commands: start detection, stop, indoor mode, outdoor mode, help');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      <View style={styles.header}>
        <Text style={styles.title}>VisionAssist</Text>
        <Text style={styles.modeIndicator}>{currentMode.toUpperCase()} MODE</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          ref={cameraRef}
        >
          {isDetecting && (
            <View style={styles.detectionOverlay}>
              <View style={styles.scanLine} />
              <Text style={styles.detectionStatus}>Detecting Objects...</Text>
            </View>
          )}
        </CameraView>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, styles.modeToggle]}
          onPress={toggleMode}
          accessible={true}
          accessibilityLabel={`Switch to ${currentMode === 'indoor' ? 'outdoor' : 'indoor'} mode`}
        >
          <Text style={styles.controlButtonText}>
            {currentMode === 'indoor' ? 'Indoor' : 'Outdoor'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, isDetecting && styles.stopButton]}
          onPress={isDetecting ? stopDetection : startDetection}
          accessible={true}
          accessibilityLabel={isDetecting ? 'Stop detection' : 'Start detection'}
        >
          {isDetecting ? (
            <Square size={24} color="white" />
          ) : (
            <Play size={24} color="white" />
          )}
          <Text style={styles.primaryButtonText}>
            {isDetecting ? 'Stop Detection' : 'Start Detection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.emergencyButton]}
          onPress={sendEmergencySOS}
          accessible={true}
          accessibilityLabel="Emergency SOS"
        >
          <AlertTriangle size={20} color="white" />
        </TouchableOpacity>
      </View>

      {detectedObjects.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Detected Objects:</Text>
          {detectedObjects.map((object, index) => (
            <Text key={index} style={styles.detectedObject}>
              • {object}
            </Text>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modeIndicator: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  detectionOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanLine: {
    width: 200,
    height: 2,
    backgroundColor: '#60A5FA',
    marginBottom: 16,
  },
  detectionStatus: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 180,
    gap: 8,
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  controlButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  modeToggle: {
    backgroundColor: '#059669',
  },
  emergencyButton: {
    backgroundColor: '#DC2626',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#374151',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    maxHeight: 150,
  },
  resultsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detectedObject: {
    color: '#D1D5DB',
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 20,
  },
});