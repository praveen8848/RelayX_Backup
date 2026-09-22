import { apiClient } from "./client";

// Toggle this to false when Spring Boot backend is running
const USE_MOCK_DATA = false;

// --- ISOLATED MOCK DATA ---
const mockDashboardMetrics = {
  totalToday: 12450,
  publishedToday: 12380,
  retrying: 42,
  dead: 8
};

const mockRelayStatus = {
  pendingCount: 42,
  deadCount: 8,
  batchSize: 10,
  pollIntervalMs: 5000,
  lastPollAt: new Date().toISOString(),
  secondsSinceLastPoll: 2
};

const mockHealth = {
  status: "UP",
  components: {
    db: { status: "UP" },
    kafka: { status: "UP" }
  }
};

const mockOutboxStats = {
  pending: 42
};

const mockRecentEvents = {
  content: [
    { id: 1, eventId: "evt_8f29a1", aggregateType: "Order", aggregateId: 1024, eventType: "OrderCreated", status: "PUBLISHED", retryCount: 0, createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: 2, eventId: "evt_a82k91", aggregateType: "Payment", aggregateId: 441, eventType: "PaymentProcessed", status: "PENDING", retryCount: 2, createdAt: new Date(Date.now() - 60000).toISOString() },
    { id: 3, eventId: "evt_f91a23", aggregateType: "Notification", aggregateId: 782, eventType: "NotificationSent", status: "DEAD", retryCount: 5, createdAt: new Date(Date.now() - 600000).toISOString() },
    { id: 4, eventId: "evt_b12c34", aggregateType: "Inventory", aggregateId: 99, eventType: "StockReserved", status: "PUBLISHED", retryCount: 0, createdAt: new Date(Date.now() - 15000).toISOString() },
    { id: 5, eventId: "evt_x99z88", aggregateType: "Order", aggregateId: 1025, eventType: "OrderCreated", status: "PROCESSING", retryCount: 0, createdAt: new Date(Date.now() - 2000).toISOString() }
  ],
  totalPages: 3,
  number: 0,
  size: 5,
  totalElements: 13
};

// --- API METHODS ---

export const getDashboardMetrics = async () => {
  if (USE_MOCK_DATA) return mockDashboardMetrics;
  return apiClient.get("/api/dashboard/metrics").then(res => res.data);
};

export const getRelayStatus = async () => {
  if (USE_MOCK_DATA) return mockRelayStatus;
  return apiClient.get("/api/relay/status").then(res => res.data);
};

export const getOutboxStats = async () => {
  if (USE_MOCK_DATA) return mockOutboxStats;
  return apiClient.get("/api/outbox/stats").then(res => res.data);
};

export const getGlobalHealth = async () => {
  if (USE_MOCK_DATA) return mockHealth;
  return apiClient.get("/actuator/health").then(res => res.data);
};

export const getRecentEvents = async () => {
  if (USE_MOCK_DATA) return mockRecentEvents;
  return apiClient.get("/api/events?size=5&page=0").then(res => res.data);
};

export const getEvents = async (params?: any) => {
  if (USE_MOCK_DATA) {
    // Simple mock filter for the UI
    let filtered = [...mockRecentEvents.content];
    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter(e => e.status === params.status);
    }
    if (params?.aggregateType) {
      filtered = filtered.filter(e => e.aggregateType.toLowerCase().includes(params.aggregateType.toLowerCase()));
    }
    return { ...mockRecentEvents, content: filtered };
  }
  return apiClient.get("/api/events", { params }).then(res => res.data);
};

export const getOrderDetails = async (orderId: number | string) => {
  if (USE_MOCK_DATA) {
    return {
      id: orderId,
      customerId: "demo-customer-1",
      amount: 100.00,
      status: "CREATED",
      createdAt: new Date().toISOString(),
      outboxEventCreated: true,
      outboxEventId: 42
    };
  }
  return apiClient.get(`/api/orders/${orderId}`).then(res => res.data);
};

export const triggerDuplicate = async (eventId: string) => {
  if (USE_MOCK_DATA) {
    return { eventId, message: "Event reset to PENDING. Consumer should ignore the duplicate." };
  }
  return apiClient.post(`/simulate/duplicate/${eventId}`).then(res => res.data);
};

export const retryDLQEvent = async (id: number) => {
  if (USE_MOCK_DATA) {
    return { result: "Event reset for retry" };
  }
  return apiClient.post(`/api/dlq/${id}/retry`).then(res => res.data);
};

export const discardDLQEvent = async (id: number) => {
  if (USE_MOCK_DATA) {
    return { result: "Event discarded" };
  }
  return apiClient.delete(`/api/dlq/${id}`).then(res => res.data);
};
export const getDLQEvents = async (): Promise<any[]> => {
  if (USE_MOCK_DATA) return mockRecentEvents.content.filter(e => e.status === 'DEAD');
  return apiClient.get("/api/dlq").then(res => {
    // Safely return the array whether Spring Boot sent a List or a Page<T>
    return res.data.content ? res.data.content : res.data;
  });
};

// --- PROJECTS (E19 - E21) ---
export const getProjects = async (): Promise<any[]> => {
  if (USE_MOCK_DATA) {
    return [{ id: 1, name: "TenantA", apiKey: "relay_live_123456789", createdAt: new Date().toISOString() }];
  }
  return apiClient.get("/api/projects").then(res => res.data);
};

export const createProject = async (name: string) => {
  if (USE_MOCK_DATA) {
    return { id: 2, name, apiKey: `relay_live_${Date.now()}`, createdAt: new Date().toISOString() };
  }
  return apiClient.post(`/api/projects?name=${encodeURIComponent(name)}`).then(res => res.data);
};

export const publishTenantEvent = async (payload: any) => {
  if (USE_MOCK_DATA) {
    return { eventId: `evt_${Date.now()}`, status: "accepted" };
  }
  return apiClient.post("/api/events", payload).then(res => res.data);
};

// --- PLAYGROUND SIMULATIONS (E22 - E28) ---
let isMockKafkaDown = false;

export const simulateKafkaDown = async () => {
  if (USE_MOCK_DATA) {
    isMockKafkaDown = true;
    return { result: "failed", message: "Kafka simulated offline. Next publish will fail." };
  }
  return apiClient.post("/simulate/kafka-down").then(res => res.data);
};

export const recoverKafka = async () => {
  if (USE_MOCK_DATA) {
    isMockKafkaDown = false;
    return { result: "recovered", message: "Kafka connection restored." };
  }
  return apiClient.post("/simulate/kafka-up").then(res => res.data);
};

export const getKafkaSimulationStatus = async () => {
  if (USE_MOCK_DATA) return { kafkaDown: isMockKafkaDown };
  return apiClient.get("/simulate/kafka-status").then(res => res.data);
};

export const seedDemoData = async () => {
  if (USE_MOCK_DATA) return { created: 13, message: "Demo data seeded. Refresh the dashboard." };
  return apiClient.post("/simulate/seed").then(res => res.data);
};



export const simulateDbRollback = async () => {
  if (USE_MOCK_DATA) return { result: "rolled back", message: "Order and outbox event were NOT saved." };
  return apiClient.post("/simulate/db-rollback").then(res => res.data);
};

export const generateBulkEvents = async (count: number) => {
  if (USE_MOCK_DATA) return { created: count, message: `Bulk events queued. Watch the relay drain them.` };
  return apiClient.post(`/simulate/bulk?count=${count}`).then(res => res.data);
};

export const createOrderingDemo = async (customerId: string) => {
  if (USE_MOCK_DATA) return { aggregateId: 5, message: "Three ordered events created. Relay will publish them in order." };
  return apiClient.post(`/simulate/ordering-demo?customerId=${encodeURIComponent(customerId)}`).then(res => res.data);
};

export const createOrder = async (payload: any) => {
  if (USE_MOCK_DATA) return { id: 5, customerId: payload.customerId, amount: payload.amount, status: "CREATED", createdAt: new Date().toISOString(), outboxEventCreated: true, outboxEventId: 42 };
  return apiClient.post("/api/orders", payload).then(res => res.data);
};