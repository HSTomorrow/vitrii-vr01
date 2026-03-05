import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { api } from '../services/api';

export default function ChatScreen() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(false);
      const response = await api.get('/chat/conversations');
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      setIsLoading(false);
    }
  };

  const renderConversation = ({ item }: any) => (
    <TouchableOpacity style={styles.conversationItem}>
      <View style={styles.conversationContent}>
        <Text style={styles.conversationName}>{item.participante}</Text>
        <Text style={styles.conversationPreview} numberOfLines={1}>
          {item.ultimaMensagem}
        </Text>
      </View>
      <Text style={styles.conversationTime}>{item.data}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma conversa ainda</Text>
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
  listContent: {
    paddingTop: 8,
  },
  conversationItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
    marginRight: 12,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  conversationPreview: {
    fontSize: 14,
    color: '#666',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
