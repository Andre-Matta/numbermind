import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import {
  scale,
  getResponsivePadding,
  getResponsiveFontSize,
  spacing,
  borderRadius,
  isTablet,
} from '../../utils/responsiveUtils';

const CATEGORY_TABS = [
  { key: 'Theme', label: 'Themes', icon: 'color-palette' },
  { key: 'Powerup', label: 'Powerups', icon: 'flash' },
  { key: 'Avatar', label: 'Avatars', icon: 'person' },
  { key: 'Bundle', label: 'Bundles', icon: 'cube' },
];

export default function InventoryModal({ visible, onClose }) {
  const { user, refreshUser } = useAuth();
  const [currentTab, setCurrentTab] = useState('Theme');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const inventoryByCategory = useMemo(() => {
    const grouped = CATEGORY_TABS.reduce((acc, c) => ({ ...acc, [c.key]: [] }), {});
    const items = Array.isArray(user?.inventory) ? user.inventory : [];
    items.forEach(item => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      }
    });
    return grouped;
  }, [user]);

  useEffect(() => {
    if (visible) {
      // Refresh on open to ensure latest purchased items are shown
      (async () => {
        try {
          setIsRefreshing(true);
          await refreshUser();
        } catch (e) {
          // noop
        } finally {
          setIsRefreshing(false);
        }
      })();
    }
  }, [visible, refreshUser]);

  const handleTabChange = useCallback((tabKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTab(tabKey);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refreshUser();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshUser]);

  const renderTabButton = (tab) => {
    const isActive = currentTab === tab.key;
    return (
      <TouchableOpacity
        key={tab.key}
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => handleTabChange(tab.key)}
      >
        <Ionicons name={isActive ? tab.icon : `${tab.icon}-outline`} size={getResponsiveFontSize(16)} color={isActive ? '#fff' : '#ccc'} />
        <Text style={[styles.tabLabel, { color: isActive ? '#fff' : '#ccc' }]}>{tab.label}</Text>
      </TouchableOpacity>
    );
  };

  const itemsForActiveTab = inventoryByCategory[currentTab] || [];

  const renderItemCard = (item) => {
    return (
      <View key={`${item.itemId}`} style={styles.itemCard}>
        <View style={styles.itemMedia}>
          {item.imageData ? (
            <Image source={{ uri: `data:image/png;base64,${item.imageData}` }} style={styles.itemImage} />
          ) : item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemIconFallback}>
              <Ionicons name="cube-outline" size={getResponsiveFontSize(24)} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.itemMetaRow}>
            <Text style={styles.itemMetaText}>Qty: {item.quantity ?? 1}</Text>
            <Text style={styles.itemMetaTextSmall}>{new Date(item.acquiredAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED', '#6D28D9']} style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="bag" size={getResponsiveFontSize(24)} color="#fff" />
                <Text style={styles.headerTitle}>Bag</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.refreshButton} onPress={handleManualRefresh} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="refresh" size={getResponsiveFontSize(18)} color="#fff" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={getResponsiveFontSize(24)} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.tabsRow}>
            {CATEGORY_TABS.map(renderTabButton)}
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {itemsForActiveTab.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bag-handle-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No items in {CATEGORY_TABS.find(t => t.key === currentTab)?.label}</Text>
                <Text style={styles.emptySubtext}>Purchase items from the shop or receive gifts to fill your bag.</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {itemsForActiveTab.map(renderItemCard)}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    height: isTablet ? '75%' : '85%',
    width: isTablet ? '55%' : '85%',
  },
  header: {
    paddingVertical: getResponsivePadding(16),
    paddingHorizontal: getResponsivePadding(20),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: scale(4),
  },
  refreshButton: {
    padding: scale(6),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#2D3748',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: getResponsivePadding(10),
    gap: scale(2),
  },
  activeTabButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  tabLabel: {
    fontSize: getResponsiveFontSize(10),
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: getResponsivePadding(16),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  itemCard: {
    width: isTablet ? '30%' : '47%',
    backgroundColor: '#f7f7f7',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#eee',
    padding: getResponsivePadding(10),
  },
  itemMedia: {
    height: scale(70),
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(8),
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemIconFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  itemInfo: {
    gap: scale(4),
  },
  itemName: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    color: '#333',
  },
  itemMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMetaText: {
    fontSize: getResponsiveFontSize(12),
    color: '#666',
    fontWeight: '600',
  },
  itemMetaTextSmall: {
    fontSize: getResponsiveFontSize(10),
    color: '#999',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(32),
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: getResponsiveFontSize(12),
    color: '#999',
    textAlign: 'center',
  },
});


