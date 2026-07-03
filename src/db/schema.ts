import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Tabla de Contactos
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(), 
  name: text("name").notNull(),
  lastMessage: text("last_message"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla del Historial de Mensajes
export const messages = pgTable("messages", {
  id: text("id").primaryKey(), 
  contactId: text("contact_id").notNull().references(() => contacts.id),
  body: text("body").notNull(),
  isMine: boolean("is_mine").default(false).notNull(), 
  timestamp: timestamp("timestamp").notNull(),
});