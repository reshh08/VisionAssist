import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Volume2, Battery, Shield, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [batterySaverMode, setBatterySaverMode] = useState(false);
  const [emergencyContactSet, setEmergencyContactSet] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.8);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSpeechEnabled = await AsyncStorage.getItem('speechEnabled');
      const savedBatterySaver = await AsyncStorage.getItem('batterySaverMode');
      const savedEmergencyContact = await AsyncStorage.getItem('emergencyContact');
      const savedSpeechRate = await AsyncStorage.getItem('speechRate');

      if (savedSpeechEnabled !== null) {
        setSpeechEnabled(JSON.parse(savedSpeechEnabled));
      }
      if (savedBatterySaver !== null) {
        setBatterySaverMode(JSON.parse(savedBatterySaver));
      }
      if (savedEmergencyContact) {
        setEmergencyContactSet(true);
      }
      if (savedSpeechRate) {
        setSpeechRate(parseFloat(savedSpeechRate));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log('Error saving setting:', error);
    }
  };

  const toggleSpeech = (value: boolean) => {
    setSpeechEnabled(value);
    saveSetting('speechEnabled', value);
    if (value) {
      Speech.speak('Text to speech enabled');
    }
  };

  const toggleBatterySaver = (value: boolean) => {
    setBatterySaverMode(value);
    saveSetting('batterySaverMode', value);
    if (speechEnabled) {
      Speech.speak(value ? 'Battery saver mode enabled' : 'Battery saver mode disabled');
    }
  };

  const adjustSpeechRate = (direction: 'faster' | 'slower') => {
    let newRate = speechRate;
    if (direction === 'faster' && speechRate < 1.2) {
      newRate = speechRate + 0.1;
    } else if (direction === 'slower' && speechRate > 0.5) {
      newRate = speechRate - 0.1;
    }
    
    setSpeechRate(newRate);
    AsyncStorage.setItem('speechRate', newRate.toString());
    
    if (speechEnabled) {
      Speech.speak('Speech rate adjusted', { rate: newRate });
    }
  };

  const setupEmergencyContact = () => {
    Alert.alert(
      'Emergency Contact Setup',
      'In a production app, this would allow you to set up a trusted contact for emergency situations.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Set Contact',
          onPress: () => {
            setEmergencyContactSet(true);
            AsyncStorage.setItem('emergencyContact', 'example@email.com');
            if (speechEnabled) {
              Speech.speak('Emergency contact saved successfully');
            }
          },
        },
      ]
    );
  };

  const showAppInfo = () => {
    Alert.alert(
      'VisionAssist Info',
      'VisionAssist v1.0\n\nAn accessibility-focused app designed to help visually impaired users navigate their environment using real-time object detection and voice interaction.\n\nVoice Commands:\n• "Start detection"\n• "Stop"\n• "Indoor mode"\n• "Outdoor mode"\n• "Help" (Emergency)',
      [{ text: 'OK' }]
    );
  };

  const testSpeech = () => {
    if (speechEnabled) {
      Speech.speak('This is a speech test. VisionAssist text to speech is working correctly.', {
        rate: speechRate,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your VisionAssist experience</Text>
      </View>

      <View style={styles.settingsContainer}>
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Audio Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Volume2 size={24} color="#60A5FA" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Text-to-Speech</Text>
                <Text style={styles.settingDescription}>
                  Enable voice announcements for detected objects
                </Text>
              </View>
            </View>
            <Switch
              value={speechEnabled}
              onValueChange={toggleSpeech}
              trackColor={{ false: '#374151', true: '#60A5FA' }}
              thumbColor={speechEnabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Speech Rate</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustSpeechRate('slower')}
                disabled={speechRate <= 0.5}
              >
                <Text style={styles.adjustButtonText}>Slower</Text>
              </TouchableOpacity>
              <Text style={styles.rateDisplay}>{speechRate.toFixed(1)}x</Text>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustSpeechRate('faster')}
                disabled={speechRate >= 1.2}
              >
                <Text style={styles.adjustButtonText}>Faster</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.testButton} onPress={testSpeech}>
            <Text style={styles.testButtonText}>Test Speech</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Performance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Battery size={24} color="#10B981" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Battery Saver Mode</Text>
                <Text style={styles.settingDescription}>
                  Auto-pause camera when idle to conserve battery
                </Text>
              </View>
            </View>
            <Switch
              value={batterySaverMode}
              onValueChange={toggleBatterySaver}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={batterySaverMode ? '#059669' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Safety</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={setupEmergencyContact}>
            <View style={styles.settingInfo}>
              <Shield size={24} color={emergencyContactSet ? '#10B981' : '#EF4444'} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Emergency Contact</Text>
                <Text style={styles.settingDescription}>
                  {emergencyContactSet ? 'Contact configured' : 'Set up emergency contact'}
                </Text>
              </View>
            </View>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={showAppInfo}>
            <View style={styles.settingInfo}>
              <Info size={24} color="#60A5FA" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>App Information</Text>
                <Text style={styles.settingDescription}>
                  Version, help, and usage instructions
                </Text>
              </View>
            </View>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  settingsContainer: {
    flex: 1,
    padding: 20,
  },
  settingGroup: {
    marginBottom: 32,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustButton: {
    backgroundColor: '#4B5563',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adjustButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  rateDisplay: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  arrow: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});