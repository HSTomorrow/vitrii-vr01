import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { api } from '../services/api';

interface Anuncio {
  id: number;
  titulo: string;
  descricao: string;
  preco: number;
  imagem?: string;
  anunciante: {
    nome: string;
    avatar?: string;
  };
}

export default function HomeScreen({ navigation }: any) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnuncios();
  }, []);

  const loadAnuncios = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/anuncios?limit=20');
      setAnuncios(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnuncios();
    setRefreshing(false);
  };

  const renderAnuncioCard = ({ item }: { item: Anuncio }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AnuncioDetail', { id: item.id })}
    >
      {item.imagem && (
        <Image
          source={{ uri: item.imagem }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.titulo}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.descricao}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            R$ {item.preco.toFixed(2)}
          </Text>
          <Text style={styles.cardSeller}>
            Por {item.anunciante.nome}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && anuncios.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#025CB6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={anuncios}
        renderItem={renderAnuncioCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Nenhum anúncio encontrado</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#025CB6',
  },
  cardSeller: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
