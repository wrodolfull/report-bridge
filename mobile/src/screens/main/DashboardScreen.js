import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Portal,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { reportsAPI } from '../../services/api';
import { globalStyles } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    completedReports: 0,
    monthlyGrowth: 12
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await reportsAPI.getAll();
      if (response.data.success) {
        const reportsData = response.data.reports;
        setReports(reportsData.slice(0, 3)); // Últimos 3 relatórios
        
        // Calcular estatísticas
        setStats({
          totalReports: reportsData.length,
          pendingReports: reportsData.filter(r => r.status === 'pending').length,
          completedReports: reportsData.filter(r => r.status === 'completed').length,
          monthlyGrowth: 12 // Simulado
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const statsCards = [
    {
      title: 'Total de Relatórios',
      value: stats.totalReports,
      icon: 'document-text',
      color: '#007bff',
      change: '+12%'
    },
    {
      title: 'Pendentes',
      value: stats.pendingReports,
      icon: 'time',
      color: '#ffc107',
      change: '-5%'
    },
    {
      title: 'Concluídos',
      value: stats.completedReports,
      icon: 'checkmark-circle',
      color: '#28a745',
      change: '+18%'
    },
    {
      title: 'Crescimento',
      value: `${stats.monthlyGrowth}%`,
      icon: 'trending-up',
      color: '#17a2b8',
      change: '+3%'
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
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
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#007bff', '#0056b3']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}!
            </Text>
            <Text style={styles.headerSubtitle}>
              Aqui está um resumo dos seus relatórios
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScroll}
          >
            {statsCards.map((stat, index) => (
              <Card key={index} style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <View style={styles.statHeader}>
                    <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                      <Ionicons name={stat.icon} size={24} color={stat.color} />
                    </View>
                    <Text style={[styles.statChange, {
                      color: stat.change.startsWith('+') ? '#28a745' : '#dc3545'
                    }]}>
                      {stat.change}
                    </Text>
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Relatórios Recentes</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Reports')}
              compact
            >
              Ver todos
            </Button>
          </View>

          {reports.length > 0 ? (
            reports.map((report) => (
              <Card key={report.id} style={styles.reportCard}>
                <Card.Content>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportDate}>
                      {formatDate(report.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.reportDescription}>
                    {report.description || 'Sem descrição'}
                  </Text>
                  <View style={styles.reportFooter}>
                    <View style={[styles.reportTypeBadge, {
                      backgroundColor: '#e3f2fd'
                    }]}>
                      <Text style={styles.reportTypeText}>
                        {report.type || 'Geral'}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Ionicons name="document-text-outline" size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>Nenhum relatório encontrado</Text>
                <Text style={styles.emptyDescription}>
                  Comece criando seu primeiro relatório
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Reports')}
                  style={styles.emptyButton}
                >
                  Criar Relatório
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActions}>
            <Card style={styles.actionCard}>
              <Card.Content style={styles.actionContent}>
                <Ionicons name="add-circle" size={32} color="#007bff" />
                <Text style={styles.actionTitle}>Novo Relatório</Text>
                <Text style={styles.actionDescription}>
                  Criar um novo relatório
                </Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.actionCard}>
              <Card.Content style={styles.actionContent}>
                <Ionicons name="bar-chart" size={32} color="#28a745" />
                <Text style={styles.actionTitle}>Analytics</Text>
                <Text style={styles.actionDescription}>
                  Ver análises detalhadas
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>

      <Portal>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('Reports')}
        />
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  headerContent: {
    paddingTop: 10,
  },
  
  greeting: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  
  statsContainer: {
    marginTop: -40,
    marginBottom: 20,
  },
  
  statsScroll: {
    paddingHorizontal: 16,
  },
  
  statCard: {
    width: width * 0.4,
    marginHorizontal: 4,
    elevation: 4,
  },
  
  statContent: {
    alignItems: 'center',
  },
  
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  statChange: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  
  reportCard: {
    marginBottom: 12,
    elevation: 2,
  },
  
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  reportTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  reportTypeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  
  emptyCard: {
    elevation: 2,
  },
  
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  
  emptyButton: {
    marginTop: 8,
  },
  
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  actionCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  
  actionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
  },
});

export default DashboardScreen;

