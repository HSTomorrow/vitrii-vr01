import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { api } from '../services/api';

export default function AnuncioDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [anuncio, setAnuncio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnuncio();
  }, [id]);

  const loadAnuncio = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/anuncios/${id}`);
      setAnuncio(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar anúncio:', error);
      Alert.alert('Erro', 'Não foi possível carregar o anúncio');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = () => {
    // Navegar para tela de contato ou abrir chat
    Alert.alert('Contato', 'Entre em contato com o vendedor');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#025CB6" />
      </View>
    );
  }

  if (!anuncio) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Anúncio não encontrado</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {anuncio.imagem && (
          <Image
            source={{ uri: anuncio.imagem }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{anuncio.titulo}</Text>

          <Text style={styles.price}>R$ {anuncio.preco.toFixed(2)}</Text>

          <View style={styles.seller}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>
                {anuncio.anunciante.nome.charAt(0)}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{anuncio.anunciante.nome}</Text>
              <Text style={styles.sellerLocation}>
                {anuncio.anunciante.localidade}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>{anuncio.descricao}</Text>

          {anuncio.categoria && (
            <>
              <Text style={styles.sectionTitle}>Categoria</Text>
              <Text style={styles.category}>{anuncio.categoria}</Text>
            </>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContact}
            >
              <Text style={styles.contactButtonText}>Entrar em Contato</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#eee',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#025CB6',
    marginBottom: 16,
  },
  seller: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#025CB6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sellerLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    color: '#025CB6',
    fontWeight: '600',
    marginBottom: 16,
  },
  actions: {
    marginTop: 20,
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#025CB6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
