type TicketContext = {
  ticketId: string;
  status: string;
  requester: {  // user who made ticket
    id: string;
    name: string;
  } | null;
  technician: { // assigned technician
    id: string;
    name: string;
  } | null;
  ratingAllowed: boolean; // allowed to rate this ticket?
  createdAt: number;  // when was context created
};

const ticketContextStore = new Map<string, TicketContext>();

export function saveTicketContext(context: TicketContext) {
  ticketContextStore.set(context.ticketId, context);
}

export function getTicketContext(ticketId: string) {
  return ticketContextStore.get(ticketId) ?? null;
}