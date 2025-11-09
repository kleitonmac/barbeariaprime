import mongoose, { Schema, models } from "mongoose";

// Schema em português para corresponder ao frontend
const schedulingSchema = new Schema(
  {
    nome: { type: String, required: true },
    telefone: { type: String, required: true },
    servico: { type: String, required: true },
    preco: { type: Number, required: true },
    data: { type: String, required: true },
    horario: { type: String, required: true },
    timestamp: { type: Number },
    status: {
      type: String,
      enum: ['pendente', 'concluido', 'cancelado'],
      default: 'pendente'
    },
    criadoEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date }
  },
  {
    // força o nome da collection para 'agendamentos'
    collection: "agendamentos",
    timestamps: true
  }
);

// Interface para tipagem
export interface Agendamento {
  _id?: string;
  nome: string;
  telefone: string;
  servico: string;
  preco: number;
  data: string;
  horario: string;
  timestamp?: number;
  status: 'pendente' | 'concluido' | 'cancelado';
  criadoEm?: Date;
  atualizadoEm?: Date;
}

// Interface para estatísticas do dashboard
export interface DashboardStats {
  lucroHoje: number;
  lucroMensal: number;
  totalAgendamentos: number;
  mediaDiaria: number;
  agendamentosHoje: number;
  agendamentosMes: number;
  lucrosPorDia: Record<string, number>;
  servicosMaisPopulares: Array<{
    servico: string;
    quantidade: number;
    lucroTotal: number;
  }>;
}

export const Scheduling = models.Scheduling || mongoose.model("Scheduling", schedulingSchema);
