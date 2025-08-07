import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const LoadingScreen = () => {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="analytics" size={60} color="#ffffff" />
          <Text style={styles.appName}>Report Bridge</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color="#ffffff" 
            style={styles.spinner}
          />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  content: {
    alignItems: 'center',
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  
  appName: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  
  loadingContainer: {
    alignItems: 'center',
  },
  
  spinner: {
    marginBottom: 16,
  },
  
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoadingScreen;

