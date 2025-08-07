import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Chip,
  ActivityIndicator,
  Searchbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { reportsAPI } from '../../services/api';
import { globalStyles } from '../../styles/globalStyles';

const ReportsScreen = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general'
  });

  const reportTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'general', label: 'Geral' },
    { value: 'sales', label: 'Vendas' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operações' }
  ];

  const loadReports = useCallback(async () => {
    try {
      const response = await reportsAPI.getAll();
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, selectedFilter]);

  const filterReports = () => {
    let filtered = reports;

    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(report => report.type === selectedFilter);
    }

    setFilteredReports(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, [loadReports]);

  const handleCreateReport = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Erro', 'Título é obrigatório');
      return;
    }

    try {
      const response = await reportsAPI.create(formData);
      if (response.data.success) {
        Alert.alert('Sucesso', 'Relatório criado com sucesso!');
        setModalVisible(false);
        resetForm();
        loadReports();
      }
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      Alert.alert('Erro', 'Erro ao criar relatório');
    }
  };

  const handleUpdateReport = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Erro', 'Título é obrigatório');
      return;
    }

    try {
      const response = await reportsAPI.update(editingReport.id, formData);
      if (response.data.success) {
        Alert.alert('Sucesso', 'Relatório atualizado com sucesso!');
        setModalVisible(false);
        setEditingReport(null);
        resetForm();
        loadReports();
      }
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      Alert.alert('Erro', 'Erro ao atualizar relatório');
    }
  };

  const handleDeleteReport = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este relatório?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await reportsAPI.delete(id);
              if (response.data.success) {
                Alert.alert('Sucesso', 'Relatório excluído com sucesso!');
                loadReports();
              }
            } catch (error) {
              console.error('Erro ao excluir relatório:', error);
              Alert.alert('Erro', 'Erro ao excluir relatório');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (report) => {
    setEditingReport(report);
    setFormData({
      title: report.title,
      description: report.description || '',
      type: report.type
    });
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingReport(null);
    resetForm();
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'general'
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingReport(null);
    resetForm();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTypeLabel = (type) => {
    return reportTypes.find(t => t.value === type)?.label || 'Geral';
  };

  if (loading) {
    return (
      <View style={globalStyles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={styles.container}>
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Pesquisar relatórios..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {reportTypes.map((type) => (
              <Chip
                key={type.value}
                selected={selectedFilter === type.value}
                onPress={() => setSelectedFilter(type.value)}
                style={styles.filterChip}
              >
                {type.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Reports List */}
        <ScrollView
          style={styles.reportsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <Card key={report.id} style={styles.reportCard}>
                <Card.Content>
                  <View style={styles.reportHeader}>
                    <View style={styles.reportTitleContainer}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <Text style={styles.reportDate}>
                        {formatDate(report.created_at)}
                      </Text>
                    </View>
                    <Chip
                      mode="outlined"
                      compact
                      style={styles.typeChip}
                      textStyle={styles.typeChipText}
                    >
                      {getTypeLabel(report.type)}
                    </Chip>
                  </View>
                  
                  <Text style={styles.reportDescription}>
                    {report.description || 'Sem descrição disponível'}
                  </Text>
                  
                  <View style={styles.reportActions}>
                    <Button
                      mode="outlined"
                      icon="eye"
                      compact
                      onPress={() => {
                        Alert.alert('Visualizar', 'Funcionalidade em desenvolvimento');
                      }}
                    >
                      Ver
                    </Button>
                    <Button
                      mode="outlined"
                      icon="pencil"
                      compact
                      onPress={() => openEditModal(report)}
                    >
                      Editar
                    </Button>
                    <Button
                      mode="outlined"
                      icon="delete"
                      compact
                      textColor="#dc3545"
                      onPress={() => handleDeleteReport(report.id)}
                    >
                      Excluir
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Ionicons name="document-text-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>
                  {searchQuery || selectedFilter !== 'all'
                    ? 'Nenhum relatório encontrado'
                    : 'Nenhum relatório criado'
                  }
                </Text>
                <Text style={styles.emptyDescription}>
                  {searchQuery || selectedFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando seu primeiro relatório'
                  }
                </Text>
                <Button
                  mode="contained"
                  onPress={openCreateModal}
                  style={styles.emptyButton}
                >
                  Criar Relatório
                </Button>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        {/* FAB */}
        <Portal>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={openCreateModal}
          />
        </Portal>

        {/* Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingReport ? 'Editar Relatório' : 'Novo Relatório'}
              </Text>
              
              <TextInput
                label="Título *"
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Tipo"
                value={getTypeLabel(formData.type)}
                mode="outlined"
                editable={false}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon="chevron-down"
                    onPress={() => {
                      Alert.alert(
                        'Selecionar Tipo',
                        'Escolha o tipo do relatório',
                        reportTypes.slice(1).map(type => ({
                          text: type.label,
                          onPress: () => setFormData({...formData, type: type.value})
                        }))
                      );
                    }}
                  />
                }
              />
              
              <TextInput
                label="Descrição"
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
              />
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={closeModal}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={editingReport ? handleUpdateReport : handleCreateReport}
                  style={styles.modalButton}
                >
                  {editingReport ? 'Atualizar' : 'Criar'}
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  
  searchbar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#f8f9fa',
  },
  
  filtersContainer: {
    paddingVertical: 4,
  },
  
  filterChip: {
    marginRight: 8,
  },
  
  reportsContainer: {
    flex: 1,
    padding: 16,
  },
  
  reportCard: {
    marginBottom: 16,
    elevation: 2,
  },
  
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  reportTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  
  typeChip: {
    height: 28,
  },
  
  typeChipText: {
    fontSize: 11,
  },
  
  reportDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  
  emptyCard: {
    elevation: 2,
    marginTop: 50,
  },
  
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  emptyButton: {
    marginTop: 8,
  },
  
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
  },
  
  modalContainer: {
    margin: 20,
  },
  
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
  },
  
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  
  input: {
    marginBottom: 16,
  },
  
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ReportsScreen;

