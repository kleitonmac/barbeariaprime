import React, { useState, useEffect } from 'react';
import { Scissors, LogOut, Trash2, Edit, X, Save, Clock, User, Phone, Home, DollarSign, TrendingUp, Calendar, Plus } from 'lucide-react';

import { Agendamento, DashboardStats } from '../models/scheduling';

function Admin() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Agendamento | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agendamentos' | 'dashboard'>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    lucroHoje: 0,
    lucroMensal: 0,
    totalAgendamentos: 0,
    mediaDiaria: 0,
    agendamentosHoje: 0,
    agendamentosMes: 0,
    lucrosPorDia: {},
    servicosMaisPopulares: []
  });

  // Senha do admin - em produção, use environment variables
  const ADMIN_PASSWORD = 'prime2025#';

  useEffect(() => {
    if (isAuthenticated) {
      loadAgendamentos();
      
      // Polling mais frequente para atualizações em tempo real
      const interval = setInterval(() => {
        loadAgendamentos();
      }, 1000);

      // Observa mudanças no localStorage para sincronização entre abas
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'agendamentos' && e.newValue) {
          const newData = JSON.parse(e.newValue);
          setAgendamentos(newData);
          calcularEstatisticas(newData);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      
      // Verifica atualizações do localStorage a cada 500ms
      const storageInterval = setInterval(() => {
        const localData = localStorage.getItem('agendamentos');
        if (localData) {
          const parsedData = JSON.parse(localData);
          const currentData = JSON.stringify(agendamentos);
          
          if (currentData !== localData) {
            setAgendamentos(parsedData);
            calcularEstatisticas(parsedData);
          }
        }
      }, 500);
      
      // Adiciona notificação sonora para novos agendamentos
      const audio = new Audio('/notification.mp3');
      let lastAppointmentCount = 0;
      
      const checkNewAppointments = async () => {
        try {
          const response = await fetch('/api/scheduling');
          const { data, success } = await response.json();
          if (success && data.length > lastAppointmentCount) {
            // Novo agendamento detectado
            const newAppointments = data.slice(lastAppointmentCount);
            newAppointments.forEach((appointment: Agendamento) => {
              // Toca som de notificação
              audio.play();
              
              // Mostra notificação visual
              const notification = document.createElement('div');
              notification.className = 'bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-500 opacity-0';
              notification.innerHTML = `
                <div class="flex items-center space-x-3">
                  <div class="flex-1">
                    <h3 class="font-bold">Novo Agendamento!</h3>
                    <p class="text-sm">${appointment.nome} - ${appointment.servico}</p>
                    <p class="text-sm">${formatarData(appointment.data)} às ${appointment.horario}</p>
                    <p class="text-sm font-bold text-green-200">${formatarMoeda(appointment.preco || 0)}</p>
                  </div>
                </div>
              `;
              
              const container = document.getElementById('notification-container');
              if (container) {
                container.appendChild(notification);
                // Animação de entrada
                setTimeout(() => notification.classList.add('opacity-100'), 100);
                // Remove após 5 segundos
                setTimeout(() => {
                  notification.classList.remove('opacity-100');
                  setTimeout(() => notification.remove(), 500);
                }, 5000);
              }
              // Toca som de notificação
              audio.play();
              
              // Mostra notificação na tela
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Novo Agendamento!', {
                  body: `${appointment.nome} - ${appointment.servico}\n${formatarData(appointment.data)} às ${appointment.horario}`,
                  icon: '/scissors.png'
                });
              }
            });
            
            // Atualiza contagem e dashboard
            lastAppointmentCount = data.length;
            setAgendamentos(data);
            calcularEstatisticas(data);
          }
        } catch (error) {
          console.error('Erro ao verificar novos agendamentos:', error);
        }
      };
      
      // Verifica novos agendamentos a cada 3 segundos
      const notificationInterval = setInterval(checkNewAppointments, 3000);
      
      // Solicita permissão para notificações
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      return () => {
        clearInterval(interval);
        clearInterval(notificationInterval);
        clearInterval(storageInterval);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isAuthenticated]);

  const calcularEstatisticas = (agendamentos: Agendamento[]) => {
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = hoje.substring(0, 7); // YYYY-MM
    
    const agendamentosHoje = agendamentos.filter(a => a.data === hoje);
    const agendamentosMes = agendamentos.filter(a => a.data.startsWith(mesAtual));
    
    const lucroHoje = agendamentosHoje.reduce((total, a) => total + (a.preco || 0), 0);
    const lucroMensal = agendamentosMes.reduce((total, a) => total + (a.preco || 0), 0);
    
    // Agrupar lucros por dia
    const lucrosPorDia = agendamentosMes.reduce((acc, a) => {
      const dia = a.data;
      acc[dia] = (acc[dia] || 0) + (a.preco || 0);
      return acc;
    }, {} as Record<string, number>);
    
    // Serviços mais populares
    const servicosAgrupados = agendamentosMes.reduce((acc, a) => {
      const servico = a.servico;
      if (!acc[servico]) {
        acc[servico] = { quantidade: 0, lucroTotal: 0 };
      }
      acc[servico].quantidade++;
      acc[servico].lucroTotal += a.preco || 0;
      return acc;
    }, {} as Record<string, { quantidade: number; lucroTotal: number }>);
    
    const servicosMaisPopulares = Object.entries(servicosAgrupados)
      .map(([servico, stats]) => ({
        servico,
        quantidade: stats.quantidade,
        lucroTotal: stats.lucroTotal
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
    
    const diasComAgendamento = Object.keys(lucrosPorDia).length;
    const mediaDiaria = diasComAgendamento > 0 ? lucroMensal / diasComAgendamento : 0;
    
    setDashboardStats({
      lucroHoje,
      lucroMensal,
      totalAgendamentos: agendamentos.length,
      mediaDiaria,
      agendamentosHoje: agendamentosHoje.length,
      agendamentosMes: agendamentosMes.length,
      lucrosPorDia,
      servicosMaisPopulares
    });
  };

  const loadAgendamentos = async () => {
    setLoading(true);
    try {
      // Função para atualizar timestamps no localStorage
      const updateLocalStorage = (data: Agendamento[]) => {
        const agora = new Date().getTime();
        localStorage.setItem('agendamentos', JSON.stringify(data));
        localStorage.setItem('agendamentosTimestamp', agora.toString());
        localStorage.setItem('lastUpdate', agora.toString());
      };
      // Tenta carregar do localStorage primeiro
      const localData = localStorage.getItem('agendamentos');
      const localTimestamp = localStorage.getItem('agendamentosTimestamp');
      const agora = new Date().getTime();
      
      // Verifica se os dados locais existem e têm menos de 24 horas
      if (localData && localTimestamp && (agora - Number(localTimestamp)) < 24 * 60 * 60 * 1000) {
        const parsedData = JSON.parse(localData);
        setAgendamentos(parsedData);
        calcularEstatisticas(parsedData);
      }

      // Tenta buscar dados atualizados do servidor
      const response = await fetch('/api/scheduling');
      if (response.ok) {
        const { data, success } = await response.json();
        if (success) {
          // Atualiza dados e localStorage
          updateLocalStorage(data);
          setAgendamentos(data);
          calcularEstatisticas(data);

          // Dispara evento de atualização para outras abas
          window.dispatchEvent(new CustomEvent('agendamentosUpdated', { detail: data }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      // Se falhar em carregar do servidor, usa dados locais como fallback
      const localData = localStorage.getItem('agendamentos');
      if (localData) {
        const parsedData = JSON.parse(localData);
        setAgendamentos(parsedData);
        calcularEstatisticas(parsedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar dados antigos do localStorage
  const limparDadosAntigos = () => {
    const timestamp = localStorage.getItem('agendamentosTimestamp');
    if (timestamp) {
      const agora = new Date().getTime();
      if (agora - Number(timestamp) >= 24 * 60 * 60 * 1000) {
        localStorage.removeItem('agendamentos');
        localStorage.removeItem('agendamentosTimestamp');
      }
    }
  };

  // Chama a limpeza de dados antigos ao montar o componente
  useEffect(() => {
    limparDadosAntigos();

    // Listener para atualizações de outras instâncias
    const handleCustomUpdate = (e: CustomEvent<Agendamento[]>) => {
      setAgendamentos(e.detail);
      calcularEstatisticas(e.detail);
    };

    window.addEventListener('agendamentosUpdated', handleCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('agendamentosUpdated', handleCustomUpdate as EventListener);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEditingId(null);
    setEditForm(null);
  };

  const handleEdit = (agendamento: Agendamento) => {
    if (agendamento._id) {
      setEditingId(agendamento._id);
      setEditForm({ ...agendamento });
    }
  };

  const handleSave = async () => {
    if (!editForm || !editingId) return;

    setLoading(true);
    try {
      // Remove o campo _id do objeto que será enviado para atualização
      const { _id, ...updateData } = editForm;
      
      const response = await fetch('/api/scheduling', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingId,
          ...updateData, // Usa os dados sem o _id
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedAgendamentos = agendamentos.map(a => 
          a._id === editingId ? { ...result.data } : a
        );
        setAgendamentos(updatedAgendamentos);
        
        // Atualiza localStorage
        localStorage.setItem('agendamentos', JSON.stringify(updatedAgendamentos));
        localStorage.setItem('agendamentosTimestamp', new Date().getTime().toString());
        
        setEditingId(null);
        setEditForm(null);
        alert('Agendamento atualizado com sucesso!');
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      alert(`Erro ao atualizar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    setLoading(true);
    try {
      // URL relativa funciona no Vercel automaticamente
      const response = await fetch(`/api/scheduling?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedAgendamentos = agendamentos.filter(a => a._id !== id);
        setAgendamentos(updatedAgendamentos);
        
        // Atualiza localStorage
        localStorage.setItem('agendamentos', JSON.stringify(updatedAgendamentos));
        localStorage.setItem('agendamentosTimestamp', new Date().getTime().toString());
        
        alert('Agendamento excluído com sucesso!');
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao excluir agendamento:', error);
      alert(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: keyof Agendamento, value: string | number) => {
    if (!editForm || field === '_id') return; // Impede modificação do _id
    
    const newForm = { ...editForm, [field]: value };
    setEditForm(newForm);

    // Atualiza estatísticas em tempo real ao editar qualquer campo
    const updatedAgendamentos = agendamentos.map(a =>
      a._id === editingId ? { ...a, [field]: field === 'preco' ? Number(value) || 0 : value } : a
    );
    
    // Atualiza estado e localStorage
    setAgendamentos(updatedAgendamentos);
    calcularEstatisticas(updatedAgendamentos);
    localStorage.setItem('agendamentos', JSON.stringify(updatedAgendamentos));
    localStorage.setItem('lastUpdate', new Date().getTime().toString());
  };

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Agendamentos filtrados e ordenados
  const agendamentosFiltrados = filterDate
    ? agendamentos.filter(a => a.data === filterDate)
    : agendamentos;

  const agendamentosOrdenados = [...agendamentosFiltrados].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.horario.localeCompare(b.horario);
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-6">
            <Scissors className="h-10 w-10 text-amber-500 mr-3" />
            <h1 className="text-2xl font-bold">Admin Prime</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha de Administrador
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 rounded-md px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Digite a senha"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-amber-500 text-black py-3 rounded-md font-semibold hover:bg-amber-600 transition"
            >
              Entrar
            </button>
          </form>

          {/* Botão para voltar ao site principal */}
          <div className="mt-6 pt-4 border-t border-zinc-700">
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-md font-semibold transition"
            >
              <Home className="h-4 w-4" />
              Voltar para o Site
            </a>
          </div>
          
          <p className="text-gray-400 text-sm mt-4 text-center">
            Acesso restrito ao barbeiro
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Scissors className="h-8 w-8 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold">Painel Admin</h1>
                <p className="text-gray-400 text-sm">Gerencie os agendamentos e finanças</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Botão para voltar ao site principal */}
              <a
                href="/"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
              >
                <Home className="h-4 w-4" />
                <span>Voltar ao Site</span>
              </a>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-6 pt-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-md font-semibold transition flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('agendamentos')}
            className={`px-6 py-3 rounded-md font-semibold transition flex items-center gap-2 ${
              activeTab === 'agendamentos'
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
            }`}
          >
            <Calendar className="h-5 w-5" />
            Agendamentos
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        /* Dashboard */
        <div className="container mx-auto px-6 pb-6">
          {/* Notificação de novo agendamento */}
          <div className="fixed top-4 right-4 z-50" id="notification-container"></div>

          {/* Botão de Adicionar Agendamento */}
          <div className="mb-6">
            <a
              href="/#booking"
              target="_blank"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all"
            >
              <Plus className="h-5 w-5" />
              Novo Agendamento
            </a>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20 transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Lucro Hoje</h3>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-500">{formatarMoeda(dashboardStats.lucroHoje)}</p>
              <p className="text-xs text-gray-500 mt-1">{dashboardStats.agendamentosHoje} agendamento(s)</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Lucro Mensal</h3>
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-500">{formatarMoeda(dashboardStats.lucroMensal)}</p>
              <p className="text-xs text-gray-500 mt-1">{dashboardStats.agendamentosMes} agendamento(s)</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Total de Agendamentos</h3>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-500">{dashboardStats.totalAgendamentos}</p>
              <p className="text-xs text-gray-500 mt-1">Mês: {dashboardStats.agendamentosMes}</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Média Diária</h3>
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-purple-500">
                {formatarMoeda(dashboardStats.mediaDiaria)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Mês atual</p>
            </div>
          </div>

          {/* Gráfico de Lucros Diários */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Lucro por Dia - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            
            {Object.keys(dashboardStats.lucrosPorDia).length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum agendamento neste mês</p>
            ) : (
              <div className="space-y-4">
                {Object.keys(dashboardStats.lucrosPorDia)
                  .sort()
                  .map((dia) => {
                    const lucro = dashboardStats.lucrosPorDia[dia];
                    const maxLucro = Math.max(...Object.values(dashboardStats.lucrosPorDia));
                    const porcentagem = maxLucro > 0 ? (lucro / maxLucro) * 100 : 0;

                    return (
                      <div key={dia} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">{formatarData(dia)}</span>
                          <span className="text-sm font-bold text-green-500">{formatarMoeda(lucro)}</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full transition-all"
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Serviços Mais Populares */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-amber-500" />
              Serviços Mais Populares do Mês
            </h2>
            
            {dashboardStats.servicosMaisPopulares.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum serviço registrado este mês</p>
            ) : (
              <div className="space-y-4">
                {dashboardStats.servicosMaisPopulares.map((servico) => {
                  const porcentagem = (servico.quantidade / dashboardStats.agendamentosMes) * 100;
                  
                  return (
                    <div key={servico.servico} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-300">{servico.servico}</span>
                          <span className="text-sm text-gray-500 ml-2">({servico.quantidade}x)</span>
                        </div>
                        <span className="text-sm font-bold text-green-500">{formatarMoeda(servico.lucroTotal)}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full transition-all"
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Últimos Agendamentos */}
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h2 className="text-xl font-bold">Últimos Agendamentos</h2>
            </div>
            {loading && agendamentos.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>Carregando...</p>
              </div>
            ) : agendamentosOrdenados.slice(0, 5).length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>Nenhum agendamento encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-700">
                {agendamentosOrdenados.slice(0, 5).map((agendamento) => (
                    <div key={agendamento._id || Math.random()} className="p-4 hover:bg-zinc-800 transition">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-lg">{agendamento.nome}</p>
                            <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-500">
                              {agendamento.servico}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatarData(agendamento.data)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {agendamento.horario}
                            </div>
                            <div className="flex items-center gap-1 text-green-500">
                              <DollarSign className="h-4 w-4" />
                              {formatarMoeda(agendamento.preco || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(agendamento)}
                            className="p-2 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => agendamento._id && handleDelete(agendamento._id)}
                            className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Agendamentos */
        <div className="container mx-auto px-6 pb-6">
          {/* Filtros */}
          <div className="bg-zinc-900 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Filtros</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filtrar por data
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilterDate('')}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-md transition"
                >
                  Limpar filtro
                </button>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Total de Agendamentos</h3>
              <p className="text-3xl font-bold text-amber-500">{dashboardStats.totalAgendamentos}</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Agendamentos Hoje</h3>
              <p className="text-3xl font-bold text-amber-500">{dashboardStats.agendamentosHoje}</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Filtrados</h3>
              <p className="text-3xl font-bold text-amber-500">{agendamentosFiltrados.length}</p>
            </div>
          </div>

          {/* Lista de Agendamentos */}
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h2 className="text-xl font-bold">
                Agendamentos {filterDate && `- ${formatarData(filterDate)}`}
              </h2>
            </div>

            {agendamentosOrdenados.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>Nenhum agendamento encontrado.</p>
              </div>
            ) : loading && agendamentos.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>Carregando agendamentos...</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-700">
                {agendamentosOrdenados.map((agendamento) => {
                  const isEditing = editingId === agendamento._id;
                  return (
                    <div key={agendamento._id || Math.random()} className="p-6 hover:bg-zinc-800 transition">
                      {isEditing ? (
                        // Modo Edição
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nome
                              </label>
                              <input
                                type="text"
                                value={editForm?.nome || ''}
                                onChange={(e) => handleEditChange('nome', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Telefone
                              </label>
                              <input
                                type="tel"
                                value={editForm?.telefone || ''}
                                onChange={(e) => handleEditChange('telefone', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Serviço
                              </label>
                              <input
                                type="text"
                                value={editForm?.servico || ''}
                                onChange={(e) => handleEditChange('servico', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Preço
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm?.preco || 0}
                                onChange={(e) => handleEditChange('preco', parseFloat(e.target.value) || 0)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Data
                              </label>
                              <input
                                type="date"
                                value={editForm?.data || ''}
                                onChange={(e) => handleEditChange('data', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Horário
                              </label>
                              <input
                                type="time"
                                value={editForm?.horario || ''}
                                onChange={(e) => handleEditChange('horario', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Status
                              </label>
                              <select
                                value={editForm?.status || 'pendente'}
                                onChange={(e) => handleEditChange('status', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <option value="pendente">Pendente</option>
                                <option value="concluido">Concluído</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={handleSave}
                              disabled={loading}
                              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditForm(null);
                              }}
                              disabled={loading}
                              className="flex items-center space-x-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-md transition disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Modo Visualização
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-amber-500" />
                                <span className="font-semibold text-lg">{agendamento.nome}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-green-500" />
                                <span className="text-gray-300">{agendamento.telefone}</span>
                              </div>
                              {agendamento.preco && (
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="h-4 w-4 text-green-500" />
                                  <span className="text-green-500 font-bold">{formatarMoeda(agendamento.preco)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Scissors className="h-4 w-4" />
                                <span>{agendamento.servico}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {formatarData(agendamento.data)} às {agendamento.horario}
                                  </span>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${{
                                  'pendente': 'bg-yellow-500/20 text-yellow-500',
                                  'concluido': 'bg-green-500/20 text-green-500',
                                  'cancelado': 'bg-red-500/20 text-red-500'
                                }[agendamento.status || 'pendente']}`}>
                                  {{
                                    'pendente': 'Pendente',
                                    'concluido': 'Concluído',
                                    'cancelado': 'Cancelado'
                                  }[agendamento.status || 'pendente']}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-4 md:mt-0">
                            <button
                              onClick={() => handleEdit(agendamento)}
                              disabled={loading || !agendamento._id}
                              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-md transition disabled:opacity-50"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => agendamento._id && handleDelete(agendamento._id)}
                              disabled={loading || !agendamento._id}
                              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md transition disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Excluir</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
 
export default Admin; 
