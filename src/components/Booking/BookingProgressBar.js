import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { STEPS } from './BookingWizard.constants';

export function BookingProgressBar({ styles, currentStep, COLORS, isMobile }) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
            },
          ]}
        />
      </View>
      <View style={styles.stepsRow}>
        {STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <View key={step.id} style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepCircle,
                  (isActive || isCompleted) && styles.stepCircleActive,
                  isActive && styles.stepCircleCurrent,
                ]}
              >
                <MaterialCommunityIcons
                  name={isCompleted ? 'check' : step.icon}
                  size={isMobile ? 16 : 20}
                  color={
                    isActive || isCompleted
                      ? COLORS.textInverse
                      : COLORS.textSecondary
                  }
                />
              </View>
              {!isMobile && (
                <Text
                  style={[styles.stepTitle, isActive && styles.stepTitleActive]}
                >
                  {step.title}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

