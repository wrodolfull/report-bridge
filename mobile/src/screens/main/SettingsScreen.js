import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  Avatar,
  Button,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { globalStyles } from '../../styles/globalStyles';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const settingSections = [
    {
      title: 'Conta',
      items: [
        {
          title: 'Editar Perfil',
          description: 'Alterar informações pessoais',
          icon: 'person-outline',
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade em breve'),
        },
        {
          title: 'Alterar Senha',
          description: 'Modificar sua senha de acesso',
          icon: 'lock-closed-outline',
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade em breve'),
        },
        {
          title: 'Privacidade',
          description: 'Configurações de privacidade',
          icon: 'shield-outline',
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade em breve'),
        },
      ],
    },
    {
      title: 'Preferências',
      items: [
        {
          title: 'Notificações',
          description: 'Receber notificações push',
          icon: 'notifications-outline',
          isSwitch: true,
          value: notifications,
          onValueChange: setNotifications,
        },
        {
          title: 'Modo Escuro',
          description: 'Usar tema escuro',
          icon: 'moon-outline',
          isSwitch: true,
          value: darkMode,
          onValueChange: setDarkMode,
        },
        {
          title: 'Autenticação Biométrica',
          description: 'Usar impressão digital/Face ID',
          icon: 'finger-print-outline',
          isSwitch: true,
          value: biometric,
          onValueChange: setBiometric,
        },
      ],
    },
    {
      title: 'Suporte',
      items: [
        {
          title: 'Central de Ajuda',
          description: 'FAQ e documentação',
          icon: 'help-circle-outline',
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade em breve'),
        },
        {
          title: 'Contatar Suporte',
          description: 'Enviar mensagem para o suporte',
          icon: 'mail-outline',
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade em breve'),
        },
        {
          title: 'Relatar Bug',
          description: 'Reportar problemas ou erros',
          icon: 'bug-outline',
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade em breve'),
        },
      ],
    },
    {
      title: 'Sobre',
      items: [
        {
          title: 'Versão do App',
          description: '1.0.0',
          icon: 'information-circle-outline',
          onPress: () => Alert.alert('Report Bridge', 'Versão 1.0.0\nDesenvolvido com React Native'),
        },
        {
          title: 'Termos de Uso',
          description: 'Ler termos e condições',
          icon: 'document-text-outline',
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade em breve'),
        },
        {
          title: 'Política de Privacidade',
          description: 'Como tratamos seus dados',
          icon: 'lock-open-outline',
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade em breve'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={64} 
              label={getInitials(user?.name || user?.email)}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.name || 'Usuário'}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email}
              </Text>
              <Text style={styles.userRole}>
                Administrador
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <Card key={sectionIndex} style={styles.sectionCard}>
            <Card.Content style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <List.Item
                    title={item.title}
                    description={item.description}
                    left={(props) => (
                      <List.Icon 
                        {...props} 
                        icon={() => (
                          <Ionicons 
                            name={item.icon} 
                            size={24} 
                            color="#666" 
                          />
                        )} 
                      />
                    )}
                    right={(props) => (
                      item.isSwitch ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onValueChange}
                        />
                      ) : (
                        <List.Icon 
                          {...props} 
                          icon={() => (
                            <Ionicons 
                              name="chevron-forward" 
                              size={20} 
                              color="#999" 
                            />
                          )} 
                        />
                      )
                    )}
                    onPress={item.onPress}
                    style={styles.listItem}
                  />
                  
                  {itemIndex < section.items.length - 1 && (
                    <Divider style={styles.divider} />
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        ))}

        {/* Logout Button */}
        <Card style={styles.logoutCard}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleLogout}
              icon={() => (
                <Ionicons name="log-out-outline" size={20} color="#dc3545" />
              )}
              textColor="#dc3545"
              style={styles.logoutButton}
              contentStyle={styles.logoutButtonContent}
            >
              Sair da Conta
            </Button>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Report Bridge v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            Desenvolvido com ❤️ usando React Native
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  
  avatar: {
    backgroundColor: '#007bff',
    marginRight: 16,
  },
  
  userInfo: {
    flex: 1,
  },
  
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  
  userRole: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  
  sectionContent: {
    padding: 0,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  
  listItem: {
    paddingVertical: 8,
  },
  
  divider: {
    marginLeft: 56,
  },
  
  logoutCard: {
    margin: 16,
    elevation: 2,
  },
  
  logoutButton: {
    borderColor: '#dc3545',
  },
  
  logoutButtonContent: {
    paddingVertical: 8,
  },
  
  footer: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default SettingsScreen;

