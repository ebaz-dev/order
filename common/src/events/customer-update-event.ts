import { CustomerDoc } from "../models/customer";
import { CustomerEventSubjects } from "./customer-event-subjects";

export interface CustomerUpdatedEvent {
  subject: CustomerEventSubjects.CustomerUpdated;
  data: CustomerDoc;
}
