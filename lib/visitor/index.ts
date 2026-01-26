export { 
  getOrCreateVisitorId, 
  getOrCreateVisitor, 
  updateVisitorName,
  updateVisitorEmail,
  markVisitorAsContacted,
  incrementMessageCount,
  blockVisitor,
  getVisitorById,
  getVisitorByCookieId,
} from './identification';

export type { VisitorInfo } from './identification';
