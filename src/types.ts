export type CRMData = {
  fullName: string;
  documentId: string;
  email: string;
  altPhone: string;
  address: string;
  district: string;
  reference: string;
  customerType: string;
};

export type Chat = { 
  id: string; 
  name: string; 
  lastMessage: string; 
  label: string | null; 
  crmData?: CRMData;
  assignedTo?: string | null // 🌟 AÑADIMOS ESTA LÍNEA
};

export type Message = { 
  id: string; 
  from: string; 
  body: string; 
  timestamp: Date | string;
  isMine: boolean; 
  isNote?: boolean; 
  mediaUrl?: string | null; 
  mimeType?: string | null; 
  ack?: number;
  agentName?: string | null; // 🌟 AÑADIDO: Guardará el nombre del asesor que envió el mensaje o nota
};

export type QuickReply = { 
  shortcut: string; 
  text: string 
};

export type CustomLabel = { 
  name: string; 
  color: string 
};

export type AppUser = { id: number; username: string; role: string };