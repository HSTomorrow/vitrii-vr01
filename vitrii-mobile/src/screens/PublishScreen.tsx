import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';

export default function PublishScreen() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (!titulo || !descricao || !preco || !categoria) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios');
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descricao', descricao);
      formData.append('preco', parseFloat(preco).toString());
      formData.append('categoria', categoria);

      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        formData.append('imagem', {
          uri: selectedImage,
          type: 'image/jpeg',
          name: filename,
        } as any);
      }

      await api.post('/anuncios', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Sucesso', 'Anúncio publicado com sucesso!');
      setTitulo('');
      setDescricao('');
      setPreco('');
      setCategoria('');
      setSelectedImage(null);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Erro ao publicar anúncio'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Publicar Novo Anúncio</Text>

        <TextInput
          style={styles.input}
          placeholder="Título do anúncio"
          placeholderTextColor="#999"
          value={titulo}
          onChangeText={setTitulo}
          editable={!isLoading}
        />

        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Descrição"
          placeholderTextColor="#999"
          value={descricao}
          onChangeText={setDescricao}
          multiline
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Preço (R$)"
          placeholderTextColor="#999"
          value={preco}
          onChangeText={setPreco}
          keyboardType="decimal-pad"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Categoria"
          placeholderTextColor="#999"
          value={categoria}
          onChangeText={setCategoria}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={styles.imageButton}
          onPress={pickImage}
          disabled={isLoading}
        >
          <Text style={styles.imageButtonText}>
            {selectedImage ? 'Imagem selecionada ✓' : 'Selecionar imagem'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishButton, isLoading && styles.buttonDisabled]}
          onPress={handlePublish}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishButtonText}>Publicar Anúncio</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  publishButton: {
    backgroundColor: '#FFC107',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
