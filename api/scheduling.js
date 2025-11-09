import { MongoClient, ObjectId } from "mongodb";

let cachedClient = null;
let cachedDb = null;

// Conexão com MongoDB
async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error("MONGODB_URI não configurada");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("primebarbearia");

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("agendamentos");

    // ===== POST - Criar novo agendamento =====
    if (req.method === "POST") {
      const { nome, telefone, servico, data, horario, preco } = req.body;

      if (!nome || !telefone || !servico || !data || !horario) {
        return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
      }

      const novoAgendamento = {
        nome,
        telefone,
        servico,
        preco: Number(preco) || 0,
        data,
        horario,
        criadoEm: new Date(),
        timestamp: new Date().getTime(),
        status: 'pendente' // novo campo para controle de status
      };

      const result = await collection.insertOne(novoAgendamento);
      return res.status(201).json({ 
        success: true,
        message: "Agendamento salvo com sucesso!",
        data: { ...novoAgendamento, _id: result.insertedId }
      });
    }

    // ===== PUT - Atualizar agendamento =====
    if (req.method === "PUT") {
      const { id, ...dadosAtualizados } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID do agendamento não fornecido" });
      }

      // Remove campos que não devem ser atualizados
      const camposPermitidos = ['nome', 'telefone', 'servico', 'data', 'horario', 'preco', 'status'];
      const updateData = {};
      
      camposPermitidos.forEach(campo => {
        if (dadosAtualizados[campo] !== undefined) {
          updateData[campo] = campo === 'preco' ? Number(dadosAtualizados[campo]) || 0 : dadosAtualizados[campo];
        }
      });

      // Garante que campos críticos não sejam removidos
      updateData.atualizadoEm = new Date();

      try {
        const result = await collection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { 
            $set: updateData
          },
          { returnDocument: 'after' }
        );

        if (!result.value) {
          return res.status(404).json({ error: "Agendamento não encontrado" });
        }

        return res.status(200).json({
          success: true,
          message: "Agendamento atualizado com sucesso",
          data: result.value
        });
      } catch (error) {
        console.error("❌ Erro ao atualizar agendamento:", error);
        
        // Verifica se é erro de campo imutável
        if (error.message.includes('immutable field') || error.message.includes('_id')) {
          return res.status(400).json({ 
            error: "Tentativa de modificar campo imutável. Recarregue a página e tente novamente." 
          });
        }
        
        return res.status(500).json({ error: "Erro interno do servidor: " + error.message });
      }
    }

    // ===== DELETE - Excluir agendamento =====
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "ID do agendamento não fornecido" });
      }

      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Agendamento excluído com sucesso"
      });
    }

    // ===== GET - Listar agendamentos =====
    if (req.method === "GET") {
      // Se tiver query params para data específica
      const { data } = req.query;
      
      let query = {};
      
      // Se data for fornecida, filtra por ela
      if (data) {
        query.data = data;
      }
      
      // Busca todos os agendamentos (não apenas do dia atual)
      const agendamentos = await collection
        .find(query)
        .sort({ data: 1, horario: 1 })
        .toArray();
      
      return res.status(200).json({
        success: true,
        data: agendamentos
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("❌ Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor: " + error.message });
  }
}
