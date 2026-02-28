import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TargetSns, SNS_LIST } from '../types';

interface Props {
  selected: TargetSns;
  onSelect: (sns: TargetSns) => void;
}

export function SnsPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {SNS_LIST.map((sns) => (
        <TouchableOpacity
          key={sns.id}
          style={[
            styles.button,
            selected === sns.id && styles.buttonSelected,
          ]}
          onPress={() => onSelect(sns.id)}
        >
          <Text style={styles.icon}>{sns.icon}</Text>
          <Text
            style={[
              styles.label,
              selected === sns.id && styles.labelSelected,
            ]}
          >
            {sns.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  buttonSelected: {
    backgroundColor: '#3a3a3c',
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#8e8e93',
  },
  labelSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
