import { useState, useEffect, ChangeEvent, FormEvent } from "react"; 
import { Scissors, Instagram, MessageCircle, Menu, X, Clock, Calendar, RefreshCw } from "lucide-react"; 
import { IconAlarm, IconScissors, IconAlertSquareRounded, IconCalendar, IconBrandMessenger, IconPhone, IconCurrencyReal } from '@tabler/icons-react'; 

function App() {
  interface Agendamento {
    nome: string;
    telefone: string;
    servico: string;
    preco?: number;
    data: string;
    horario: string;
    timestamp?: number;
  }

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [formData, setFormData] = useState<Agendamento>({
    nome: "",
    telefone: "",
    servico: "",
    data: "",
    horario: "",
  });
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [horaAtual, setHoraAtual] = useState<string>("");
  const [dataAtual, setDataAtual] = useState<string>("");
  const [showRefreshNotification, setShowRefreshNotification] = useState<boolean>(false);
  const [lastAutoRefresh, setLastAutoRefresh] = useState<Date>(new Date());

  // URL dinâmica da API
  const getApiUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/scheduling`;
  };

  // Serviços disponíveis
  const servicos = [
    { nome: "Corte Clássico", preco: 30, duracao: "30 min" },
    { nome: "Corte + Barba", preco: 50, duracao: "50 min" },
    { nome: "Nevou", preco: 60, duracao: "45 min" },
    { nome: "Corte com Pigmentação", preco: 70, duracao: "60 min" },
    { nome: "Barba", preco: 25, duracao: "25 min" },
    { nome: "Sobrancelha", preco: 15, duracao: "10 min" },
    { nome: "Pacote Premium", preco: 90, duracao: "80 min" },
  ];

  // 🔧 FUNÇÕES CORRIGIDAS PARA DATAS E HORÁRIOS

  // Obtém a data atual no fuso horário local (YYYY-MM-DD)
  const getDataAtual = (): string => {
    const agora = new Date();
    return agora.toISOString().split("T")[0];
  };

  // Obtém a data mínima para agendamento (data atual)
  const getDataMinima = (): string => {
    return getDataAtual();
  };

  // Obtém a data máxima para agendamento (30 dias a partir de hoje)
  const getDataMaxima = (): string => {
    const agora = new Date();
    const dataMaxima = new Date(agora);
    dataMaxima.setDate(agora.getDate() + 30);
    return dataMaxima.toISOString().split("T")[0];
  };

  // Função para obter hora atual no formato HH:MM
  const getHoraAtual = (): string => {
    const agora = new Date();
    return `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
  };

  // 🕒 Atualiza o relógio e data em tempo real
  useEffect(() => {
    const atualizarTempo = () => {
      const agora = new Date();
      const hora = agora.toLocaleTimeString("pt-BR", { hour12: false });
      const data = agora.toLocaleDateString("pt-BR");
      setHoraAtual(hora);
      setDataAtual(data);

      // Verifica se são 20:00 para forçar refresh dos agendamentos
      if (hora === "20:00:00") {
        console.log("🕗 São 20:00 - Forçando refresh dos agendamentos...");
        fetchAgendamentos(true);
      }
    };

    atualizarTempo();
    const timer = setInterval(atualizarTempo, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔄 Carregar agendamentos do localStorage
  const fetchAgendamentos = async (forceRefresh: boolean = false) => {
    try {
      // SEMPRE usa localStorage primeiro para mostrar dados imediatamente
      const localData = localStorage.getItem('agendamentos');
      if (localData) {
        const parsedData = JSON.parse(localData);
        setAgendamentos(parsedData);
        console.log('📂 Agendamentos carregados do localStorage:', parsedData.length);
      }

      // Tenta buscar dados atualizados do servidor em segundo plano
      if (forceRefresh) {
        console.log('🔄 Buscando agendamentos da API...');
        const apiUrl = getApiUrl();
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Atualiza localStorage com novos dados
            localStorage.setItem('agendamentos', JSON.stringify(result.data));
            localStorage.setItem('agendamentosTimestamp', new Date().getTime().toString());
            setAgendamentos(result.data);
            
            // Mostra notificação
            setLastAutoRefresh(new Date());
            setShowRefreshNotification(true);
            setTimeout(() => setShowRefreshNotification(false), 5000);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao buscar agendamentos da API, usando localStorage:", err);
      // Fallback para localStorage
      const localData = localStorage.getItem('agendamentos');
      if (localData) {
        setAgendamentos(JSON.parse(localData));
      }
    }
  };

  // 🔁 Reenvio automático de dados salvos localmente
  const reenviarPendentes = async () => {
    const pendentes = localStorage.getItem("pendentes");
    if (!pendentes) return;

    try {
      const dados = JSON.parse(pendentes);
      const apiUrl = getApiUrl();
      
      for (const agendamento of dados) {
        await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(agendamento),
        });
      }
      
      localStorage.removeItem("pendentes");
      console.log("✅ Pendentes reenviados com sucesso!");
    } catch (error) {
      console.error("Erro ao reenviar pendentes:", error);
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
        localStorage.removeItem('pendentes');
      }
    }
  };

  useEffect(() => {
    console.log('Iniciando aplicação...');
    limparDadosAntigos();
    fetchAgendamentos(); // Carrega do localStorage imediatamente
    reenviarPendentes();

    // Configura intervalo para limpar dados antigos
    const cleanupInterval = setInterval(limparDadosAntigos, 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Função para verificar se uma data é hoje - CORRIGIDA
  const isHoje = (data: string): boolean => {
    return data === getDataAtual();
  };

  // Função para verificar se uma data é amanhã - CORRIGIDA
  const isAmanha = (data: string): boolean => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    return data === amanha.toISOString().split("T")[0];
  };

  const formatarData = (data: string): string => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar telefone brasileiro
  const formatarTelefone = (telefone: string): string => {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numeros;
  };

  // Função para validar telefone brasileiro
  const validarTelefone = (telefone: string): boolean => {
    const numeros = telefone.replace(/\D/g, '');
    return /^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(numeros);
  };

  // 🕓 Gera horários de 09:00 às 19:00
  const horariosDisponiveisBase = Array.from({ length: 11 }, (_, i) => {
    const hora = 9 + i;
    return `${hora.toString().padStart(2, "0")}:00`;
  });

  // 🧠 Filtra horários disponíveis - CORRIGIDA
  const horariosFiltrados = formData.data ? horariosDisponiveisBase.filter((h) => {
    const ocupado = agendamentos.some(
      (a) => a.data === formData.data && a.horario === h
    );

    // Se for hoje, filtra apenas horários futuros
    if (isHoje(formData.data)) {
      const horaAtual = getHoraAtual();
      // Converte para minutos para comparação
      const minutosAtuais = parseInt(horaAtual.split(":")[0]) * 60 + parseInt(horaAtual.split(":")[1]);
      const minutosAgendamento = parseInt(h.split(":")[0]) * 60 + parseInt(h.split(":")[1]);
      
      // Permite agendamento apenas para horários futuros (com margem de 30 minutos)
      return (minutosAgendamento > minutosAtuais + 30) && !ocupado;
    }

    return !ocupado;
  }) : horariosDisponiveisBase;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'telefone') {
      const telefoneFormatado = formatarTelefone(value);
      setFormData((prev) => ({
        ...prev,
        [name]: telefoneFormatado,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // 📋 HANDLE SUBMIT CORRIGIDO
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccessMessage("");

    // Validação do telefone
    if (!validarTelefone(formData.telefone)) {
      setError("⚠️ Por favor, insira um telefone válido com DDD. Ex: (27) 91234-5678");
      setLoading(false);
      return;
    }

    // Validação: não permitir datas passadas - CORRIGIDA
    const dataSelecionada = new Date(formData.data + 'T00:00:00');
    const dataHoje = new Date(getDataAtual() + 'T00:00:00');
    
    if (dataSelecionada < dataHoje) {
      setError("⚠️ Não é possível marcar para datas passadas. Por favor, escolha uma data futura.");
      setLoading(false);
      return;
    }

    // Validação: não permitir horários passados para hoje - CORRIGIDA
    if (isHoje(formData.data)) {
      const horaAtual = getHoraAtual();
      const minutosAtuais = parseInt(horaAtual.split(":")[0]) * 60 + parseInt(horaAtual.split(":")[1]);
      const minutosAgendamento = parseInt(formData.horario.split(":")[0]) * 60 + parseInt(formData.horario.split(":")[1]);
      
      // Margem de 30 minutos para agendamentos
      if (minutosAgendamento <= minutosAtuais + 30) {
        setError("⚠️ Para agendamentos de hoje, escolha um horário com pelo menos 30 minutos de antecedência.");
        setLoading(false);
        return;
      }
    }

    if (!formData.servico) {
      setError("Por favor, selecione um serviço.");
      setLoading(false);
      return;
    }

    // Verifica conflito de horário
    const conflito = agendamentos.find(
      (a: Agendamento) => a.data === formData.data && a.horario === formData.horario
    );

    if (conflito) {
      const mensagemConflito = encodeURIComponent(
        `Olá! Vi que o horário ${formData.horario} do dia ${formatarData(formData.data)} está ocupado.` +
        ` Gostaria de verificar outros horários disponíveis para o serviço ${formData.servico}.`
      );
      const numeroBarbearia = "5527997276019";
      window.open(`https://wa.me/${numeroBarbearia}?text=${mensagemConflito}`, "_blank");
      setError("Esse horário já está ocupado. Redirecionando para o WhatsApp do barbeiro para verificar outros horários...");
      setLoading(false);
      return;
    }

    // Busca o preço do serviço selecionado
    const servicoSelecionado = servicos.find(s => s.nome === formData.servico);
    const preco = servicoSelecionado?.preco || 0;

    if (!preco || preco === 0) {
      setError("⚠️ Erro: Preço do serviço não encontrado. Tente novamente.");
      setLoading(false);
      return;
    }

    const novoAgendamento: Agendamento = {
      ...formData,
      preco,
      timestamp: new Date().getTime()
    };

    try {
      const apiUrl = getApiUrl();
      console.log('Enviando agendamento para:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...novoAgendamento,
          timestamp: new Date().getTime(),
          status: 'pendente'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resposta do servidor:', result);
      
      setSuccessMessage("Agendamento realizado com sucesso!");
      
      // Atualiza lista local imediatamente
      const novosAgendamentos = [...agendamentos, novoAgendamento];
      setAgendamentos(novosAgendamentos);
      localStorage.setItem("agendamentos", JSON.stringify(novosAgendamentos));

    } catch (error: any) {
      console.error("Erro ao salvar agendamento:", error);
      setError("Sem conexão com o servidor. Agendamento salvo localmente.");
      
      // Salva no localStorage como pendente E como agendamento local
      const pendentes = JSON.parse(localStorage.getItem("pendentes") || "[]");
      pendentes.push(novoAgendamento);
      localStorage.setItem("pendentes", JSON.stringify(pendentes));
      
      // Também salva nos agendamentos locais
      const novosAgendamentos = [...agendamentos, novoAgendamento];
      setAgendamentos(novosAgendamentos);
      localStorage.setItem("agendamentos", JSON.stringify(novosAgendamentos));
    }

    // Envia mensagem para WhatsApp
    const mensagem = encodeURIComponent(
      `*Novo Agendamento Confirmado* 📅\n\n👤 Nome: ${formData.nome}\n📞 Telefone: ${formData.telefone}\n✂️ Serviço: ${formData.servico}\n📅 Data: ${formatarData(formData.data)}\n⏰ Horário: ${formData.horario}\n✅ Confirmação automática via site\n\n📲 *Link do Agendamento:* https://barbeariaprime.vercel.app/#booking`
    );

    const numeroBarbearia = "5527997276019";
    window.open(`https://wa.me/${numeroBarbearia}?text=${mensagem}`, "_blank");

    // Limpa formulário
    setFormData({
      nome: "",
      telefone: "",
      servico: "",
      data: "",
      horario: "",
    });
    
    setLoading(false);
  };

  // Função para limpar agendamentos antigos
  useEffect(() => {
    const verificarEApagarAntigos = () => {
      const dataHoje = getDataAtual();
      const agendamentosSalvos = JSON.parse(localStorage.getItem("agendamentos") ?? "[]") as Agendamento[];
      const agendamentosAtuais = agendamentosSalvos.filter((a) => a.data >= dataHoje);
      
      if (agendamentosSalvos.length !== agendamentosAtuais.length) {
        localStorage.setItem("agendamentos", JSON.stringify(agendamentosAtuais));
        setAgendamentos(agendamentosAtuais);
      }
    };

    const interval = setInterval(verificarEApagarAntigos, 60000);
    verificarEApagarAntigos();
    
    return () => clearInterval(interval);
  }, []);

  // Impede scroll do body quando menu está aberto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  // Função para obter agendamentos por data
  const getAgendamentosPorData = (data: string) => {
    return agendamentos.filter(a => a.data === data);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Overlay escuro com blur */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Notificação de Refresh Automático */}
      {showRefreshNotification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-black px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="font-semibold">Agenda atualizada automaticamente!</span>
          <button 
            onClick={() => setShowRefreshNotification(false)}
            className="ml-2 text-black hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className={`transition-all duration-300 ${menuOpen ? 'blur-sm opacity-80' : 'blur-0 opacity-100'}`}>
        {/* Header */}
        <header className="relative h-screen" id="home">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80")' }}
          >
            <div className="absolute inset-0 bg-black/60" />
          </div>

          {/* Navbar */}
          <nav className="relative z-30 container mx-auto px-6 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-amber-500" />
              <span className="text-1xl font-bold">Novo Estilo</span>
            </div>

            {/* Relógio e Data em tempo real - Desktop */}
            <div className="hidden md:flex items-center gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span className="font-medium">{dataAtual}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="font-mono">{horaAtual}</span>
              </div>
            </div>

            <div className="hidden md:flex space-x-8 items-center">
              <a href="#home" className="hover:text-amber-500 transition">Início</a>
              <a href="#services" className="hover:text-amber-500 transition">Serviços</a>
              <a href="#booking" className="hover:text-amber-500 transition">Agendamento</a>
              <a href="#contact" className="hover:text-amber-500 transition">Contato</a>
              <a 
                href="/admin" 
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition font-semibold"
              >
                <img src="/barbeiro.png" alt="Barbeiro" className="w-4 h-4" />
                Área do Barbeiro
              </a>
            </div>

            {/* Botão Menu Mobile com Relógio e Data */}
            <div className="md:hidden flex items-center gap-4">
              {!menuOpen && (
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-sm">{dataAtual}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-sm">{horaAtual}</span>
                  </div>
                </div>
              )}
              
              <button 
                className="focus:outline-none z-50 relative"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X className="h-8 w-8 text-amber-500" />
                ) : (
                  <Menu className="h-8 w-8 text-amber-500" />
                )}
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="relative z-10 container mx-auto px-6 h-[calc(100vh-88px)] flex items-center">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Tradição no corte, atitude no estilo.
                <br />
                Bem-vindo à Barbearia Novo Estilo!
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-300">
                Agende seu horário online e transforme seu visual com a gente!
              </p>
              <a 
                href="#booking" 
                className="bg-amber-500 text-black px-8 py-4 rounded-md font-semibold hover:bg-amber-600 transition"
              >
                Agende seu Horário
              </a>
            </div>
          </div>
        </header>

        {/* Catálogo de Serviços */}
        <section id="services" className="py-20 bg-zinc-900 text-center">
          <h2 className="text-5xl font-bold mb-8">Catálogo de Serviços</h2>
          <p className="text-gray-400 mb-12">
            Escolha o corte que combina com seu estilo.
          </p>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto">
            {servicos.map((s, i) => (
              <div 
                key={i} 
                className="bg-zinc-800 p-6 rounded-lg shadow-lg hover:scale-105 transition cursor-pointer"
                onClick={() => setFormData({ ...formData, servico: s.nome })}
              >
                <h3 className="text-2xl font-bold text-amber-500 mb-3">{s.nome}</h3>
                <p className="text-gray-300 mb-2">
                  <IconCurrencyReal size={19.5} className="inline-block mr-1" />
                  {s.preco.toFixed(2)}
                </p>
                <p className="text-gray-300 flex justify-center items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-300" />
                  {s.duracao}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Agendamento - SEÇÃO MODIFICADA */}
        <section id="booking" className="py-20 bg-black">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold mb-16 text-center">Agende seu Horário</h2>
            
            <div className="max-w-md mx-auto bg-zinc-900 p-8 rounded-lg">
              {/* Aviso informativo */}
              <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500 rounded-md">
                <p className="text-blue-300 text-sm font-semibold">
                  <IconBrandMessenger className="inline-block mr-1" />
                  A agenda é atualizada automaticamente às 20:00 todos os dias de Segunda a Sábado.
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  Caso não veja horários disponíveis, tente novamente após esse horário ou entre em contato via WhatsApp.
                </p>
              </div>

              {/* Mensagens de sucesso e erro */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-md">
                  <p className="text-green-300 text-sm font-semibold">
                    ✅ {successMessage}
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-md">
                  <p className="text-red-300 text-sm font-semibold">
                    <IconAlertSquareRounded className="inline-block mr-1" />
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <input 
                  type="text" 
                  name="nome" 
                  value={formData.nome} 
                  onChange={handleChange}
                  className="w-full bg-zinc-800 rounded-md px-4 py-3 focus:ring-2 focus:ring-amber-500"
                  placeholder="Seu nome completo" 
                  required 
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Telefone
                  </label>
                  <input 
                    type="tel" 
                    name="telefone" 
                    value={formData.telefone} 
                    onChange={handleChange}
                    className="w-full bg-zinc-800 rounded-md px-4 py-3 focus:ring-2 focus:ring-amber-500"
                    placeholder="(27) 9999-99999" 
                    pattern="\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}"
                    title="Digite um telefone válido com DDD. Ex: (27) 99999-9999"
                    required 
                  />
                  <p className="text-gray-400 text-xs">
                    <IconPhone className="inline-block mr-1" />
                    Formato: (DDD) 9XXXX-XXXX para celular ou (DDD) XXXX-XXXX para fixo
                  </p>
                </div>

                <select 
                  name="servico" 
                  value={formData.servico} 
                  onChange={handleChange}
                  className="w-full bg-zinc-800 rounded-md px-4 py-3 focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Selecione o serviço</option>
                  {servicos.map((s, i) => (
                    <option key={i}>{s.nome}</option>
                  ))}
                </select>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Data do Agendamento
                  </label>
                  <input 
                    type="date" 
                    name="data" 
                    value={formData.data} 
                    onChange={handleChange}
                    min={getDataMinima()}
                    max={getDataMaxima()}
                    className="w-full bg-zinc-800 rounded-md px-4 py-3 focus:ring-2 focus:ring-amber-500"
                    required 
                  />
                  {formData.data && (
                    <p className="text-amber-400 text-sm">
                      <IconCalendar className="inline-block mr-1" />
                      Data selecionada: {formatarData(formData.data)}
                      {isHoje(formData.data) && " (Hoje)"}
                      {isAmanha(formData.data) && " (Amanhã)"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Horário Disponível
                  </label>
                  <select 
                    name="horario" 
                    value={formData.horario} 
                    onChange={handleChange}
                    className="w-full bg-zinc-800 rounded-md px-4 py-3 focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Selecione um horário</option>
                    {horariosFiltrados.length === 0 ? (
                      <option disabled>Nenhum horário disponível para esta data</option>
                    ) : (
                      horariosFiltrados.map((h, i) => (
                        <option key={i} value={h}>
                          {h}
                        </option>
                      ))
                    )}
                  </select>
                  {formData.data && (
                    <p className="text-gray-400 text-sm">
                      <IconAlarm className="inline-block mr-1" />
                      {horariosFiltrados.length} horário(s) disponível(is) para {formatarData(formData.data)}
                      {isHoje(formData.data) && " (Hoje)"}
                      {isAmanha(formData.data) && " (Amanhã)"}
                    </p>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-amber-500 text-black py-3 rounded-md font-semibold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </button>
              </form>
            </div>

            {/* Lista de Agendamentos - MODIFICADA */}
            <div className="max-w-md mx-auto mt-8 bg-zinc-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Horários Ocupados - Hoje</h3>
                <button 
                  onClick={() => fetchAgendamentos(true)}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition text-sm"
                  title="Atualizar lista"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </button>
              </div>
              
              {getAgendamentosPorData(getDataAtual()).length === 0 ? (
                <p className="text-gray-400">Nenhum agendamento para hoje.</p>
              ) : (
                <ul className="space-y-2">
                  {getAgendamentosPorData(getDataAtual())
                    .sort((a, b) => a.horario.localeCompare(b.horario))
                    .map((a, i) => (
                      <li key={i} className="bg-zinc-900 p-3 rounded-md text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-amber-400">{a.nome}</span>
                            <div className="text-gray-300 mt-1">
                              <IconScissors className="inline-block mr-1" />
                              {a.servico}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono bg-zinc-700 px-2 py-1 rounded">
                              <IconAlarm className="inline-block mr-1" />
                              {a.horario}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))
                  }
                </ul>
              )}
            </div>

            {/* Agendamentos para Amanhã */}
            <div className="max-w-md mx-auto mt-4 bg-zinc-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Horários Ocupados - Amanhã</h3>
              
              {getAgendamentosPorData(
                new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]
              ).length === 0 ? (
                <p className="text-gray-400">Nenhum agendamento para amanhã.</p>
              ) : (
                <ul className="space-y-2">
                  {getAgendamentosPorData(
                    new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]
                  )
                    .sort((a, b) => a.horario.localeCompare(b.horario))
                    .map((a, i) => (
                      <li key={i} className="bg-zinc-900 p-3 rounded-md text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-amber-400">{a.nome}</span>
                            <div className="text-gray-300 mt-1">
                              <IconScissors className="inline-block mr-1" />
                              {a.servico}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono bg-zinc-700 px-2 py-1 rounded">
                              <IconAlarm className="inline-block mr-1" />
                              {a.horario}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))
                  }
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Contato */}
        <section id="contact" className="py-20 bg-zinc-900 text-center">
          <h2 className="text-3xl font-bold mb-4">Entre em Contato</h2>
          <p className="text-gray-400 mb-6">
            📍 Av. Belo Horizonte, 1343 - Nova Carapina I, Serra<br />
            📞 (27) 99727-6019
          </p>
          <div className="flex justify-center space-x-8">
            <a href="https://www.instagram.com/novoestilobarbeariaes/" target="_blank" rel="noreferrer">
              <Instagram className="h-8 w-8 text-amber-500 hover:text-amber-600 transition" />
            </a>
            <a href="https://wa.me/5527997276019" target="_blank" rel="noreferrer">
              <MessageCircle className="h-8 w-8 text-green-500 hover:text-green-600 transition" />
            </a>
          </div>
        </section>
      </div>

      {/* Menu mobile */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-zinc-950 z-50 transform transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 text-amber-500">
              <Scissors className="h-6 w-6" />
              <span className="text-xl font-bold">Novo Estilo</span>
            </div>
            <button 
              onClick={() => setMenuOpen(false)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="h-6 w-6 text-gray-400 hover:text-amber-500" />
            </button>
          </div>

          <div className="flex flex-col space-y-2 text-lg flex-1">
            <a 
              href="#home" 
              onClick={() => setMenuOpen(false)}
              className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700"
            >
              Início
            </a>
            <a 
              href="#services" 
              onClick={() => setMenuOpen(false)}
              className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700"
            >
              Serviços
            </a>
            <a 
              href="#booking" 
              onClick={() => setMenuOpen(false)}
              className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700"
            >
              Agendamento
            </a>
            <a 
              href="#contact" 
              onClick={() => setMenuOpen(false)}
              className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700"
            >
              Contato
            </a>
            <a 
              href="/admin" 
              onClick={() => setMenuOpen(false)}
              className="text-amber-500 hover:text-amber-400 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700 font-semibold"
            >
              Área do Barbeiro
            </a>
          </div>

          <div className="mt-auto pt-6">
            <div className="flex justify-center space-x-6 mb-4">
              <a 
                href="https://www.instagram.com/novoestilobarbeariaes/" 
                target="_blank" 
                rel="noreferrer"
                className="p-3 hover:bg-zinc-800 rounded-lg transition"
              >
                <Instagram className="h-6 w-6 text-amber-500 hover:text-amber-600" />
              </a>
              <a 
                href="https://wa.me/5527997276019" 
                target="_blank" 
                rel="noreferrer"
                className="p-3 hover:bg-zinc-800 rounded-lg transition"
              >
                <MessageCircle className="h-6 w-6 text-green-500 hover:text-green-600" />
              </a>
            </div>
            <p className="text-center text-gray-400 text-sm">📍 Av. Belo Horizonte, 1343 - Nova Carapina I, Serra</p>
            <p className="text-center text-gray-400 text-sm mt-2">📞 (27) 99727-6019</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
