import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import config from '../../config/config';
import AuthService from '../../services/AuthService';
import { useData } from '../../context/DataContext';


export default function Shop({ onBack }) {
  const { userData, shopData, updateUserData } = useData();
  const [shopCategories, setShopCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    console.log('Shop: useEffect triggered with shopData:', shopData);
    console.log('Shop: userData from context:', userData);
    
    if (shopData && Object.keys(shopData).length > 0) {
      // Use shop data from DataContext if available
      console.log('Shop: Using shop data from DataContext');
      setShopCategories(shopData);
      setLoading(false);
    } else {
      // Fallback to fetching if no data in context
      console.log('Shop: No shop data in context, fetching...');
      fetchShopItems();
    }
  }, [shopData]);

  const fetchShopItems = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!AuthService.getToken()) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      const token = AuthService.getToken();
      console.log('Shop - Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${config.API_BASE_URL}/shop/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch shop items');
      }
      
      const data = await response.json();
      setShopCategories(data.categories || {});
    } catch (err) {
      setError(err.message);
      console.error('Error fetching shop items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item) => {
    try {
      const token = AuthService.getToken();
      const response = await fetch(`${config.API_BASE_URL}/shop/purchase/${item._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Purchase failed');
      }

      const result = await response.json();
      Alert.alert('Success!', `Purchased ${item.name} for ${item.price} coins!`);
      
      // Update user data in DataContext with new coin balance
      if (userData) {
        const updatedUser = { ...userData, coins: result.remainingCoins };
        updateUserData(updatedUser);
      }
      
      // Refresh shop items
      fetchShopItems();
      
    } catch (error) {
      Alert.alert('Purchase Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Shop</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.coinsDisplay}>
            <Ionicons name="diamond-outline" size={24} color="#ffd700" />
            <Text style={styles.coinsText}>{userData?.coins || 0} Coins</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading shop items...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchShopItems}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {Object.keys(shopCategories).map(category => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                  <View style={styles.itemsGrid}>
                    {shopCategories[category].map((item) => (
                      <View key={item._id} style={styles.shopItem}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemDescription}>{item.description}</Text>
                          <Text style={styles.itemType}>{item.category}</Text>
                          {item.discount > 0 && (
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountText}>{item.discount}% OFF</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.itemActions}>
                          <View style={styles.priceContainer}>
                            {item.discount > 0 ? (
                              <>
                                <Text style={styles.originalPrice}>{item.originalPrice} Coins</Text>
                                <Text style={styles.itemPrice}>{item.price} Coins</Text>
                              </>
                            ) : (
                              <Text style={styles.itemPrice}>{item.price} Coins</Text>
                            )}
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.buyButton,
                              (userData?.coins || 0) < (item.price) && styles.buyButtonDisabled
                            ]}
                            onPress={() => handlePurchase(item)}
                            disabled={(userData?.coins || 0) < (item.price)}
                          >
                            <Text style={styles.buyButtonText}>Buy</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {Object.keys(shopCategories).length === 0 && (
                <Text style={styles.comingSoon}>No shop items available</Text>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    gap: 10,
  },
  coinsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  shopItem: {
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  itemInfo: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  itemType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'capitalize',
  },
  itemActions: {
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    color: '#ffd700',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buyButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  comingSoon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  discountBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 5,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  originalPrice: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
});
