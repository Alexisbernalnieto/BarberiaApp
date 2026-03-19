import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon, Check } from 'lucide-react';

interface BookingProgressBarProps {
  styles: any;
  currentStep: number;
  STEPS: any[];
  COLORS: any;
  isMobile: boolean;
}

export default function BookingProgressBar({ 
  styles, 
  currentStep, 
  STEPS, 
  isMobile 
}: BookingProgressBarProps) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }
          ]} 
        />
      </View>

      <View style={styles.stepsRow}>
        {STEPS.map((step) => {
          const isActive = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const Icon = step.icon as any;

          return (
            <View key={step.id} style={styles.stepWrapper}>
              <View 
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCurrent && styles.stepCircleCurrent
                ]}
              >
                 {isActive ? (
                    <Check size={18} color="#000" />
                 ) : (
                    Icon ? <Icon size={18} color={isCurrent ? "#000" : "var(--text-muted)"} /> : null
                 )}
              </View>
              {!isMobile && (
                <Text style={[styles.stepTitle, (isActive || isCurrent) && styles.stepTitleActive]}>
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
