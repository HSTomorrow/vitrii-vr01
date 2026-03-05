import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { api } from '../services/api';

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);

    if (text.length < 3) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await api.get('/anuncios/search', {
        params: { q: text },
      });
      setResults(response.data.data || []);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const renderResultCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate('AnuncioDetail', { id: item.id })}
    >
      {item.imagem && (
        <Image
          source={{ uri: item.imagem }}
          style={styles.resultImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.titulo}
        </Text>
        <Text style={styles.resultPrice}>R$ {item.preco.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos, serviços..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResultCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsList}
        />
      ) : searchQuery.length >= 3 && !isSearching ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Digite pelo menos 3 caracteres para buscar
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  resultsList: {
    padding: 12,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultImage: {
    width: 100,
    height: 100,
    backgroundColor: '#eee',
  },
  resultInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#025CB6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
